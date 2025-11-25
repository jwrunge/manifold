import $ from "../../src/main.ts";

const defaultState = $.create("default");

const addTodo = (title: string) => {
    const nextId = Math.max(...state.todos.map(todo => todo.id), 0) + 1;
    state.todos.push({ id: nextId, title, completed: false });
}

const markTodoDone = (id: number) => {
    const todo = state.todos.find(todo => todo.id === id);
    if (todo) {
        todo.completed = true;
    }
}

const intermediateState = defaultState
    .add("todos", [
        { id: 1, title: "Learn Manifold", completed: false },
        { id: 2, title: "Build a project", completed: false },
        { id: 3, title: "Write tests", completed: false },
    ])
    .add({ addTodo, markTodoDone });

const state = intermediateState.build();
export default state;