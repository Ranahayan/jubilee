import { sendPost } from "~/api/base";
import { getAPIData } from "../helpers";
import { IUploadEndRequest, IUploadStartRequest } from "./types";

export const directUploadStart = (params: IUploadStartRequest) =>
  getAPIData(sendPost("file/upload/direct/start/", params));

export const directUploadEnd = (params: IUploadEndRequest) =>
  getAPIData(sendPost("file/upload/direct/finish/", params));
