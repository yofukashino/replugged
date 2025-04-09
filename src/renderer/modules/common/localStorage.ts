import { filters, getExportsForProps, waitForModule } from "../webpack";

export declare class LocalStorage {
  public get<T>(key: string, fallback?: T): T;
  public set(key: string, value: unknown): void;
  public remove(key: string): void;
  public clear(): void;
  public stringify(): string;
  public asyncGetRaw(key: string): Promise<string>;
  public setRaw(key: string, value: string): void;
  public getAfterRefresh<T>(key: string): Promise<T>;
  private storage?: Record<string, string>;
}

const getLocalStorage = async (): Promise<LocalStorage> => {
  const localStorageMod = await waitForModule(filters.bySource("delete window.localStorage"));

  return getExportsForProps<LocalStorage>(localStorageMod, ["getAfterRefresh"])!;
};

export default getLocalStorage();
