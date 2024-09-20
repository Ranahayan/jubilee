import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useDropdown } from "~/hooks/useDropdown";
import { SVG } from "~/components/ui/SVG";
import { faAngleDown, faCheck } from "@fortawesome/pro-regular-svg-icons";
import * as S from "./styles";

const LANGUAGE_CODES = [
  { code: "en", key: "english" },
  { code: "zh-CN", key: "chinese_simplified" },
  { code: "zh-TW", key: "chinese_traditional" },
  { code: "cs", key: "czech" },
  { code: "da", key: "danish" },
  { code: "nl", key: "dutch" },
  { code: "fi", key: "finnish" },
  { code: "fr", key: "french" },
  { code: "de", key: "german" },
  { code: "it", key: "italian" },
  { code: "ja", key: "japanese" },
  { code: "ko", key: "korean" },
  { code: "nb", key: "norwegian_bokmal" },
  { code: "pl", key: "polish" },
  { code: "pt-BR", key: "portuguese_brazil" },
  { code: "pt-PT", key: "portuguese_portugal" },
  { code: "es", key: "spanish" },
  { code: "sv", key: "swedish" },
  { code: "th", key: "thai" },
  { code: "tr", key: "turkish" },
];

interface ILanguageDropdownProps {
  currentLanguage: string;
  onLanguageChange: (languageCode: string) => void;
}

export const LanguageDropdown = ({ currentLanguage, onLanguageChange }: ILanguageDropdownProps) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const { dropdownSide, toggleDropdown, closeDropdown } = useDropdown(containerRef);

  const getCurrentLanguageLabel = () => {
    const currentLang = LANGUAGE_CODES.find(lang => lang.code === currentLanguage);
    return currentLang ? t(`languages.${currentLang.key}`) : currentLanguage;
  };

  return (
    <S.DropdownContainer ref={containerRef}>
      <S.LanguageButton onClick={() => toggleDropdown()}>
        {getCurrentLanguageLabel()} <SVG icon={faAngleDown} />
      </S.LanguageButton>

      {dropdownSide !== null && (
        <S.DropdownContent side={dropdownSide}>
          {LANGUAGE_CODES.map((language) => (
            <LanguageDropdownItem
              key={language.code}
              language={language}
              currentLanguage={currentLanguage}
              onLanguageChange={onLanguageChange}
              closeDropdown={closeDropdown}
            />
          ))}
        </S.DropdownContent>
      )}
    </S.DropdownContainer>
  );
};

interface ILanguageDropdownItemProps {
  language: { code: string; key: string };
  currentLanguage: string;
  onLanguageChange: (languageCode: string) => void;
  closeDropdown: () => void;
}

const LanguageDropdownItem = ({
  language,
  currentLanguage,
  onLanguageChange,
  closeDropdown,
}: ILanguageDropdownItemProps) => {
  const { t } = useTranslation();
  const selected = language.code === currentLanguage;

  return (
    <S.LanguageDropdownItem
      selected={selected}
      onClick={() => {
        onLanguageChange(language.code);
        closeDropdown();
      }}>
      {t(`languages.${language.key}`)}
      {selected && <SVG icon={faCheck} color="primary" size="lg" />}
    </S.LanguageDropdownItem>
  );
}; 
