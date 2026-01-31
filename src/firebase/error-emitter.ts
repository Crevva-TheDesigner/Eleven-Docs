import { EventEmitter } from "events"

type AppEvents = {
  "permission-error": (error: Error) => void
}

class AppEventEmitter extends EventEmitter {
  emit<T extends keyof AppEvents>(event: T, ...args: Parameters<AppEvents[T]>) {
    return super.emit(event, ...args)
  }

  on<T extends keyof AppEvents>(event: T, listener: AppEvents[T]) {
    return super.on(event, listener)
  }

  off<T extends keyof AppEvents>(event: T, listener: AppEvents[T]) {
    return super.off(event, listener)
  }
}

export const errorEmitter = new AppEventEmitter()
