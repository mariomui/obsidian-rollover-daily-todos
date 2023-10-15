export type ComplexTodoSpec = {
    text: string;
    type: "pending" | "done" | "nested";
};

class TodoParser {
    // List of strings that include the Markdown content
    #lines;

    // Boolean that encodes whether nested items should be rolled over
    #withChildren;

    constructor(lines: any, withChildren: any) {
        this.#lines = lines;
        this.#withChildren = withChildren;
    }

    // Returns true if string s is a todo-item
    #isTodo(s: any) {
        const r = /\s*- \[ \].*/g;
        return r.test(s);
    }
    #isComplexTodo(line: string): Boolean {
        const regex = /^- \[[xX ]\] .+$/g;
        return regex.test(line);
    }

    #castToComplexTodo(todo_line: string): ComplexTodoSpec | null {
        if (this.#isComplexTodo(todo_line) === false) {
            return null;
        }
        const complexTodo: ComplexTodoSpec = {
            text: todo_line,
            type: "done",
        };
        if (this.#isTodo(todo_line) === true) {
            complexTodo.type = "pending";
        }
        return complexTodo;
    }

    // Returns true if line after line-number `l` is a nested item
    #hasChildren(l: any) {
        if (l + 1 >= this.#lines.length) {
            return false;
        }
        const indCurr = this.#getIndentation(l);
        const indNext = this.#getIndentation(l + 1);
        if (indNext > indCurr) {
            return true;
        }
        return false;
    }

    // Returns a list of strings that are the nested items after line `parentLinum`
    #getChildren(parentLinum: any) {
        const children = [];
        let nextLinum = parentLinum + 1;
        while (this.#isChildOf(parentLinum, nextLinum)) {
            children.push(this.#lines[nextLinum]);
            nextLinum++;
        }
        return children;
    }

    // Returns true if line `linum` has more indentation than line `parentLinum`
    #isChildOf(parentLinum: any, linum: any) {
        if (parentLinum >= this.#lines.length || linum >= this.#lines.length) {
            return false;
        }
        return this.#getIndentation(linum) > this.#getIndentation(parentLinum);
    }

    // Returns the number of whitespace-characters at beginning of string at line `l`
    #getIndentation(l: any) {
        return this.#lines[l].search(/\S/);
    }

    // Returns a list of strings that represents all the todos along with there potential children
    getTodos() {
        let todos = [];
        for (let l = 0; l < this.#lines.length; l++) {
            const line = this.#lines[l];
            if (this.#isTodo(line)) {
                todos.push(line);
                if (this.#withChildren && this.#hasChildren(l)) {
                    const cs = this.#getChildren(l);
                    todos = [...todos, ...cs];
                    l += cs.length;
                }
            }
        }
        return todos;
    }
    getComplexTodos(): ComplexTodoSpec[] {
        let todos: ComplexTodoSpec[] = [];
        for (let l = 0; l < this.#lines.length; l++) {
            const line = this.#lines[l];
            if (this.#isComplexTodo(line)) {
                const complexTodo = this.#castToComplexTodo(line);
                todos.push(complexTodo);
                if (this.#withChildren && this.#hasChildren(l)) {
                    const cs = this.#getChildren(l);
                    const mapTextToComplexTodo = (text: string) => {
                        return {
                            text,
                            type: "nested",
                        } as ComplexTodoSpec;
                    };
                    const _cs: ComplexTodoSpec[] = cs.map(mapTextToComplexTodo);
                    todos = [...todos, ..._cs];
                    l += cs.length;
                }
            }
        }
        console.log({ todos });
        return todos;
    }
}

// Utility-function that acts as a thin wrapper around `TodoParser`
export const getTodos = ({
    lines,
    withChildren = false,
}: {
    lines: any;
    withChildren: boolean;
}) => {
    const todoParser = new TodoParser(lines, withChildren);
    return todoParser.getTodos();
};

export const getComplexTodos = ({
    lines,
    withChildren = false,
}: {
    lines: any;
    withChildren: boolean;
}) => {
    const todoParser = new TodoParser(lines, withChildren);
    return todoParser.getComplexTodos();
};