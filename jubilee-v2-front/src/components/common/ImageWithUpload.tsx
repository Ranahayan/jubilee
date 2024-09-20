import { useEffect } from "react";
import { FileUploader } from "react-drag-drop-files";
import { IFile, IUploadHook } from "~/types/upload";
import * as S from "./ImageWithUpload.style";

type Props = {
  imageFile?: IFile;
  upload?: IUploadHook;
};

const fileTypes = ["JPG", "PNG", "GIF"];

const ImageWithUpload = ({ upload, imageFile }: Props) => {
  const handleChange = (file: File) => {
    upload?.upload(file);
  };

  useEffect(() => {
    if (imageFile) {
      upload?.setFile(imageFile);
    }
  }, []);

  const internalImage = upload?.file;

  return (
    <S.Container>
      {internalImage ? (
        <S.Image background={internalImage.url || ""} />
      ) : (
        <FileUploader
          classes="file-uploader"
          disabled={!upload}
          multiple={false}
          handleChange={handleChange}
          types={fileTypes}
        />
      )}
    </S.Container>
  );
};

export default ImageWithUpload;
