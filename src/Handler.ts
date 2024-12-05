import {
    CancellationToken,
    OutputChannel,
    TestController,
    TestItem,
    TestItemCollection,
    TestRunRequest,
} from 'vscode';
import { Configuration } from './Configuration';
import { OutputChannelObserver, TestResultObserver } from './Observers';
import { Command, TestRunner, TestType } from './PHPUnit';
import { TestCase, TestCollection } from './TestCollection';

export class Handler {
    private lastRequest: TestRunRequest | undefined;

    constructor(private ctrl: TestController, private configuration: Configuration, private testCollection: TestCollection, private outputChannel: OutputChannel) { }

    getLastRequest() {
        return this.lastRequest;
    }

    async startTestRun(request: TestRunRequest, cancellation?: CancellationToken) {
        const command = new Command(this.configuration, { cwd: this.testCollection.getWorkspace() });
        const queue: { test: TestItem; data: TestCase }[] = [];
        const run = this.ctrl.createTestRun(request);

        const discoverTests = async (tests: Iterable<TestItem>) => {
            for (const test of tests) {
                if (request.exclude?.includes(test)) {
                    continue;
                }

                const data = this.testCollection.getTestCase(test);
                if (data?.type === TestType.method) {
                    run.enqueued(test);
                    queue.push({ test, data });
                } else {
                    await discoverTests(this.gatherTestItems(test.children));
                }
            }
        };

        const runTestQueue = async () => {
            const runner = new TestRunner();
            runner.observe(new TestResultObserver(queue, run, cancellation));
            runner.observe(new OutputChannelObserver(this.outputChannel, this.configuration, request));

            const processes = !request.include
                ? [runner.run(command)]
                : request.include
                    .map((test) => this.testCollection.getTestCase(test)!)
                    .map((testCase) => runner.run(testCase.update(command)));

            cancellation?.onCancellationRequested(() => processes.forEach((process) => process.kill()));

            await Promise.all(processes.map((process) => process.wait()));

            return;
        };

        await discoverTests(request.include ?? this.gatherTestItems(this.ctrl.items)).then(runTestQueue);
        this.lastRequest = request;
    }

    private gatherTestItems(collection: TestItemCollection) {
        const items: TestItem[] = [];
        collection.forEach((item) => items.push(item));

        return items;
    }
}