export interface IFile {
  id?: string | number;
  url?: string;
  file?: string;
}

export interface IUploadHook {
  upload: (file: File) => Promise<IFile | undefined | null>;
  file?: IFile | null;
  setFile: (file: IFile | null) => void;
}
