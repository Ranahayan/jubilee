import { IFile, IUploadHook } from "~/types/upload";
import { faPlus, faXmark } from "@fortawesome/pro-solid-svg-icons";
import { FileUploader } from "react-drag-drop-files";
import { useEffect } from "react";
import { SVGIcon } from "~/components/ui/SVG/types";
import { SVG } from "~/components/ui/SVG";
import FlexContainer from "~/components/ui/FlexContainer";

import * as S from "./styles";

type Props = {
  imageFile?: IFile;
  upload?: IUploadHook;
  files: IFile[];
  remove?: (id: string) => void;
};

const fileTypes = ["JPG", "PNG", "GIF"];

const UploadImages = ({ imageFile, upload, files, remove }: Props) => {
  const handleChange = (file: File) => {
    upload?.upload(file);
  };

  useEffect(() => {
    if (imageFile) {
      upload?.setFile(imageFile);
    }
  }, []);

  return (
    <FlexContainer>
      {files &&
        files.map((file) => (
          <S.ImageContainer key={file.id}>
            <S.Image src={file.url} />
            {remove && (
              <S.IconContainer onClick={() => remove(file.id as string)}>
                <SVG icon={faXmark as SVGIcon} />
              </S.IconContainer>
            )}
          </S.ImageContainer>
        ))}

      <S.AddImage>
        <FileUploader
          classes="file-uploader"
          disabled={!upload}
          multiple={false}
          handleChange={handleChange}
          types={fileTypes}>
          <SVG icon={faPlus as SVGIcon} color="primary" size="xl" />
        </FileUploader>
      </S.AddImage>
    </FlexContainer>
  );
};

export default UploadImages;
