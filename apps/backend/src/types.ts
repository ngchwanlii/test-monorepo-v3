import type { Logger } from './logger.js';
import type { TodoService } from './services/todo-service.js';

export type AppVariables = {
  logger: Logger;
  todoService: TodoService;
};

export type AppEnv = {
  Variables: AppVariables;
};
