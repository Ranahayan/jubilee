import { Fragment, useCallback, useEffect, useState } from "react";
import * as S from "./styles";
import { useTranslation } from "react-i18next";
import { formConfig } from "./invoiceForm";
import { brandingFormConfig } from "./brandingForm";
import { useUpload } from "~/hooks/useUpload";
import LoaderSVG from "~/assets/svg/loader.svg?react";
import {
  useDropshippingSettings,
  useUpdateDropshippingSettings,
} from "~/api/dropshipping/queries";
import BrandingPreview from "~/pages/branding/brandPreview";
import {
  DROPSHIPPING_SETTINGS,
  IDropshippingSettings,
} from "~/api/dropshipping/types";
import { Plans } from "~/components/plans";
import { usePlanFeature } from "~/hooks/usePlanFeature";
import { Limits } from "~/types/billing";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount } from "~/hooks/useAccount";
import { FormContext, useForm } from "~/hooks/useForm";
import { IFile } from "~/types/upload";
import handleErrors from "~/helpers/handleErrors";
import FlexContainer from "~/components/ui/FlexContainer";
import { PageTitle } from "~/components/plans/plans.style";
import { Form } from "~/components/ui/Form";
import Button from "~/components/ui/Button";
import Modal from "~/components/ui/Modal";

const BrandingPage = () => {
  const { t } = useTranslation();
  const { upload } = useUpload();
  const brandingForm = useForm(brandingFormConfig);
  const invoiceForm = useForm(formConfig);
  const { data, isLoading } = useDropshippingSettings();
  const { mutateAsync: updateSettings, isLoading: isSaving } =
    useUpdateDropshippingSettings();
  const { account } = useAccount();
  const [showConnectToStore, setShowConnectToStore] = useState(false);
  const { brand_name, font_family } = brandingForm.getValues();
  const [showPlansModal, setShowPlansModal] = useState(false);
  const { isFeatureDisabled } = usePlanFeature();
  const client = useQueryClient();

  useEffect(() => {
    if (data) {
      const {
        invoice_store_name,
        invoice_contact_email,
        invoice_website,
        invoice_body,
        invoice_logo,
        brand_name,
        font_family,
        brand_logo,
        distributor_city,
        distributor_zip,
      } = data;

      invoiceForm.loadValues({
        invoice_store_name,
        invoice_contact_email,
        invoice_website,
        invoice_body,
        invoice_logo,
      });

      brandingForm.loadValues({
        brand_name,
        brand_logo,
        font_family: {
          label: font_family as string,
          value: font_family as string,
        },
        distributor_city,
        distributor_zip,
      });
    }
  }, [data]);

  const handleSave = useCallback(async () => {
    if (isFeatureDisabled(Limits.PAID_PLAN)) {
      return setShowPlansModal(true);
    }

    const payload: IDropshippingSettings = {
      shop: data?.shop,
      ...invoiceForm.getValues(),
    };
    payload.invoice_logo =
      (((payload.invoice_logo as IFile) || {}).id as number) || 0;

    const toastMessages = {
      error: t("branded_invoice.error"),
      loading: t("branded_invoice.loading"),
      success: t("branded_invoice.success"),
    };

    await handleErrors(() => updateSettings(payload), toastMessages);
    client.invalidateQueries(DROPSHIPPING_SETTINGS);
  }, [invoiceForm]);

  const handleBrandingSave = useCallback(async () => {
    if (isFeatureDisabled(Limits.PAID_PLAN)) {
      return setShowPlansModal(true);
    }

    const payload: IDropshippingSettings = {
      shop: data?.shop,
      ...brandingForm.getValues(),
    };
    payload.brand_logo =
      (((payload.brand_logo as IFile) || {}).id as number) || 0;

    const toastMessages = {
      error: t("branding.error"),
      loading: t("branding.loading"),
      success: t("branding.success"),
    };

    await handleErrors(() => updateSettings(payload), toastMessages);
    client.invalidateQueries(DROPSHIPPING_SETTINGS);
  }, [brandingForm]);

  const handlePreviewInvoice = useCallback(() => {
    window.open(
      `${import.meta.env.VITE_API_URL}/dropshipping/invoice/preview/${account?.id}/`,
      "_blank"
    );
  }, [account]);

  return (
    <Fragment>
      <FlexContainer flexDirection="column" width="100%">
        <PageTitle>{t("nav.branding")}</PageTitle>
      </FlexContainer>
        <>
          <S.BrandingSettings>
            <S.BrandingSettingsForm>
              <h3>{t("branding.title")}</h3>
              <p>{t("branding.description")}</p>
              <FormContext.Provider value={{ uploadFile: upload }}>
                <Form {...brandingForm} />
              </FormContext.Provider>
              <S.Actions>
                <Button
                  isDisabled={isSaving}
                  onClick={handleBrandingSave}
                  color="white"
                  bgColor="primary">
                  {t("branded_invoice.save_changes")}
                </Button>
              </S.Actions>
            </S.BrandingSettingsForm>
            <BrandingPreview
              brandName={brand_name as string}
              fontFamily={font_family as string}
            />
          </S.BrandingSettings>
          <S.BrandedInvoiceFields>
            {isLoading ? (
              <S.Loading>
                <LoaderSVG />
              </S.Loading>
            ) : null}
            <h3>{t("branded_invoice.title")}</h3>
            <p>{t("branded_invoice.description")}</p>
            <FormContext.Provider value={{ uploadFile: upload }}>
              <Form {...invoiceForm} />
            </FormContext.Provider>

            <S.Actions>
              <Button
                isDisabled={isSaving}
                onClick={handleSave}
                color="white"
                bgColor="primary">
                {t("branded_invoice.save_changes")}
              </Button>
              <Button outline onClick={handlePreviewInvoice}>
                {t("branded_invoice.preview_invoice")}
              </Button>
            </S.Actions>
          </S.BrandedInvoiceFields>
        </>
      <Modal
        hide={() => setShowPlansModal(!showPlansModal)}
        isShowing={showPlansModal}
        minWidth="70%">
        <Plans closeModal={() => setShowPlansModal(!showPlansModal)} />
      </Modal>
    </Fragment>
  );
};

export default BrandingPage;