import { FormFieldConfigs } from "~/types/form";

const fonts = [
  "Roboto",
  "Montserrat",
  "Lato",
  "Oswald",
  "Nunito",
  "Merriweather",
  "Pacifico",
  "Raleway",
  "Open Sans",
  "Sniglet",
  "Cabin",
  "Abril Fatface",
  "Special Elite",
  "Six Caps",
  "Josefin Slab",
  "Homemade Apple",
  "Playfair Display",
  "Permanent Marker",
  "Roboto Condensed",
  "Safira March"
];

const fontObjects = fonts.map(font => ({ label: font, value: font }));

export const brandingFormConfig: FormFieldConfigs = [
  {
    type: "string",
    labelKey: "branding.brand_field",
    key: "brand_name",
		size: 6,
    isRequired: false
  },
	{
    type: "select",
    labelKey: "branding.fonts_field",
    key: "font_family",
		size: 6,
    isRequired: true,
    options: fontObjects
  },
  {
    type: "file",
    labelKey: "branding.logo_field",
    key: "brand_logo",
    placeholder: "branding.logo_field_placeholder",
    filetypes: ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"],
		size: 12,
    isRequired: false
  },
  {
    type: "string",
    labelKey: "branding.distributor_city",
    key: "distributor_city",
    size: 6,
    isRequired: false
  },
  {
    type: "string",
    labelKey: "branding.distributor_zip",
    key: "distributor_zip",
    size: 6,
    isRequired: false
  },
];
