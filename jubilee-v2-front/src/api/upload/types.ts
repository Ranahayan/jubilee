export interface IUploadStartRequest {
  file_name: string;
  file_type: string;
}

export interface IUploadEndRequest {
  file_id: string;
}
