// 全局函数声明
declare function Page<T = any>(options: any): void;
declare function App(options: any): void;
declare function Component(options: any): void;
declare function Behavior(options: any): void;
declare function getApp(): any;
declare function require(module: string): any;

// TDesign模块声明
declare module 'tdesign-miniprogram/message/index' {
  const Message: any;
  export default Message;
}

declare module 'tdesign-miniprogram/input/input' {
  const Input: any;
  export default Input;
}

declare module 'tdesign-miniprogram/textarea/textarea' {
  const Textarea: any;
  export default Textarea;
}

declare module 'tdesign-miniprogram/button/button' {
  const Button: any;
  export default Button;
}

declare module 'tdesign-miniprogram/toast/toast' {
  const Toast: any;
  export default Toast;
}

// 全局定时器声明
declare function setTimeout(callback: () => void, delay: number): number;
declare function setInterval(callback: () => void, delay: number): number;
declare function clearTimeout(id: number): void;
declare function clearInterval(id: number): void;

// 全局对象
declare const wx: {
  getStorageSync(key: string): any;
  setStorageSync(key: string, data: any): void;
  switchTab(options: { url: string }): void;
  navigateTo(options: { url: string }): void;
  navigateBack(): void;
  showModal(options: {
    title: string;
    content: string;
    success?(res: { confirm: boolean }): void;
  }): void;
  showLoading(options: { title: string; mask?: boolean }): void;
  hideLoading(): void;
  showToast(options: {
    title: string;
    icon?: 'success' | 'error' | 'loading' | 'none';
    duration?: number;
  }): void;
  requestSubscribeMessage(options: {
    tmplIds: string[];
    success?(res: Record<string, string>): void;
    fail?(err: any): void;
    complete?(): void;
  }): void;
  cloud: {
    callFunction(options: {
      name: string;
      data?: any;
    }): Promise<{ result: any }>;
    getTempFileURL(options: {
      fileList: string[];
    }): Promise<{ fileList: { tempFileURL: string; fileID: string }[] }>;
    init(options?: { env?: string | object; traceUser?: boolean }): void;
  };
};

declare const console: {
  log(...args: any[]): void;
  error(...args: any[]): void;
  warn(...args: any[]): void;
};

// 事件类型
interface TouchEvent {
  currentTarget: {
    dataset: Record<string, any>;
  };
}

interface Input {
  detail: {
    value: string;
  };
}

interface CustomEvent {
  detail: any;
}

// 模块声明
declare module '~/utils/memory' {
  export { MemoryStorage, calculateCountdown, formatDate, formatDateWithWeek, formatCountdown };
}

declare module '~/types/index' {
  export { Memory, CountdownResult, StorageResult, HomePageData, AddMemoryPageData };
}

declare module '../../utils/cloud-memory' {
  const CloudMemorySync: {
    autoSync(): Promise<void>;
    bidirectionalSync(): Promise<{ success: boolean }>;
    getSyncStatus(): { status: string; text: string; color: string };
  };
  export default CloudMemorySync;
}

declare module '../../utils/auth' {
  export const AuthAPI: {
    logout(): void;
  };
}