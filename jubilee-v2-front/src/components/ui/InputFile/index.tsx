import {
  ChangeEvent,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { UIProps } from "~/types/style";
import FlexContainer from "../FlexContainer";
import * as S from "./styles";
import { FormFieldValue } from "~/types/form";
import { faTrash, faDownload } from "@fortawesome/pro-solid-svg-icons";
import { SVG } from "../SVG";
import { SVGIcon } from "../SVG/types";
import LoaderSVG from "~/assets/svg/loader.svg?react";
import { FormContext } from "~/hooks/useForm";
import { useTranslation } from "react-i18next";
import { toast } from "~/components/toast";
import { faArrowDownToBracket } from "@fortawesome/pro-regular-svg-icons";

interface Props extends UIProps {
  isDisabled?: boolean;
  value?: string;
  placeholder?: string;
  types?: string[];
  onChange?: (value: FormFieldValue) => void;
}

interface UploadedFile {
  url: string;
  id?: string;
}

interface FileResponse {
  file_name: string;
  url: string;
}

const getFileName = (file: FileResponse) => {
  if (file.file_name) return file.file_name;
  const parts = file.url.split("/");
  return parts[parts.length - 1];
};

const InputFile = ({
  isDisabled,
  value,
  placeholder,
  types = [],
  onChange,
}: Props) => {
  const [isUploading, setIsUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const { uploadFile } = useContext(FormContext);
  const [file, setFile] = useState<UploadedFile | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (value) {
      if (typeof value === "object") {
        setFile(value as UploadedFile);
      } else {
        setFile({ url: value });
      }
    }
  }, [value]);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      if (uploadFile) {
        try {
          const file = event.target.files?.[0];
          if (file && !types.includes(file.type)) {
            toast.error(t("common.upload_file_type_not_supported"));
            return;
          }

          setIsUploading(true);
          const result = await uploadFile(file as File);
          const uploadedFile: any = result;
          setIsUploading(false);

          if (uploadedFile && onChange) {
            uploadedFile.file_name = file?.name as string;
            setFile(uploadedFile);
            onChange(uploadedFile);
          }
        } catch {
          setIsUploading(false);
        }
      } else {
        throw new Error("FormContext is not provided");
      }
    },
    []
  );

  const showFileDialog = useCallback(() => {
    if (isDisabled) return;
    ref.current?.click();
  }, [ref]);

  const handleDownload = () => {
    window.open(file?.url, "_blank");
  };

  const handleRemove = () => {
    setFile(null);
    onChange && onChange(null);
  };

  return (
    <FlexContainer width="100%" flexDirection="column">
      <S.InputFileWrapper isDisabled={isDisabled}>
        <S.InputShadow ref={ref} type="file" onChange={handleFileChange} />
        <S.FileInfo>
          {isUploading ? (
            <S.Loader>
              <LoaderSVG />
            </S.Loader>
          ) : null}

          {file ? (
            getFileName(file as FileResponse)
          ) : (
            <FlexContainer>
              <SVG icon={faArrowDownToBracket} color="primary" />{" "}
              {t(placeholder as string)}, or 
              <S.BrowseAnchor onClick={showFileDialog}>browse</S.BrowseAnchor>
            </FlexContainer>
          )}
        </S.FileInfo>

        <S.ActionsWrapper>
          {!file ? null : (
            <>
              <S.ActionButton isSecondary onClick={handleDownload}>
                <SVG icon={faDownload as SVGIcon} />
              </S.ActionButton>
              <S.ActionButton onClick={handleRemove}>
                <SVG icon={faTrash as SVGIcon} />
              </S.ActionButton>
            </>
          )}
        </S.ActionsWrapper>
      </S.InputFileWrapper>
    </FlexContainer>
  );
};

export default InputFile;
