import { useTranslation } from "react-i18next";
import { toast } from "~/components/toast";
import { directUploadEnd, directUploadStart } from "~/api/upload/requests";
import { IFile, IUploadHook } from "~/types/upload";
import { axios } from "~/api/base";
import { useState } from "react";
import { isProduction } from "~/helpers/environment";

export const useUpload = (): IUploadHook => {
  const [file, setFile] = useState<IFile | null>(null);
  const { t } = useTranslation();

  const directUploadDo = ({ data, file }: { data: any; file: File }) => {
    const postData = new FormData();

    for (const key in data?.fields) postData.append(key, data.fields[key]);

    postData.append("file", file);

    let headers = {};

    if (axios && axios.defaults.headers.common.Authorization && isProduction) {
      // To upload to S3, remove Authorization headers from request...
      headers = { Authorization: "" };
    }

    if (!axios) return Promise.reject("Axios is not initialized");

    return axios
      .post(data.url, postData, { headers })
      .then(() => Promise.resolve({ fileId: data.id }));
  };

  const upload: IUploadHook["upload"] = async (file) => {
    if (!file) return null;
    const uploadStartParams = {
      file_name: file.name,
      file_type: file.type,
    };
    const toastID = toast.info(t("upload.in_progress"));

    try {
      const uploadStart = await directUploadStart(uploadStartParams);
      const uploadData = await directUploadDo({ data: uploadStart, file });
      const uploadedData = (await directUploadEnd({
        file_id: uploadData.fileId,
      })) as IFile;
      toast.update(toastID, {
        type: "success",
        render: t("upload.success"),
      });
      setFile(uploadedData);
      return uploadedData;
    } catch (e) {
      toast.update(toastID, {
        type: "error",
        render: t("upload.error"),
      });
      return Promise.reject(e);
    }
  };

  return {
    upload,
    file,
    setFile,
  };
};
