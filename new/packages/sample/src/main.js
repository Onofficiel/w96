/*
Sample CLI App Template
Copyright (C) Author 2023.

< Shorthand license may be added here >
*/

// Create a terminal reference for later use.
const term = this.boxedEnv.term;

if(!term)
    return;

/**
 * The app class.
 */
class HelloWorldApplication extends WApplication {
    /**
     * Constructs a new HelloWorldApplication instance.
     */
    constructor() {
        super();
    }

    /**
     * Program entry point.
     * @param {string[]} argv The program arguments.
     * @returns {number} Exit code.
     */
    async main(argv) {
        await super.main(argv);
        term.writeln('Hello World!');
        term.writeln('Welcome to the most useful app!');

        let firstName = await term.prompt("Enter your first name: ");
        term.writeln('Nice job ' + firstName + '!');

        let lastName = await term.prompt('Last name: ');
        term.writeln(`Hi there ${firstName} ${lastName}!`);
        await term.pause();
    }

    /**
     * Program cleanup function.
     * 
     * Called on program exit.
     */
    async onterminate() {
        await super.onterminate();

        // Cleanup code
    }
}

