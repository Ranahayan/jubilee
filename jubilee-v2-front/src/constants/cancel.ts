export enum LeavingOptions {
  BILLING = "billing",
  FEATURES = "features",
  EXPENSIVE = "expensive",
  NOT_SURE = "not_sure",
  OTHER = "other",
}

export enum ModalTypes {
  PAUSE = "pause",
  EXCEEDED = "exceededPause",
  IMPROVE = "improve",
  HELP = "help",
  EXTEND = "extendTrial",
  SURE = "cancelSure",
};

export const LostOptions = [
  "cancel.your_account",
  "cancel.winning",
  "cancel.vip",
  "cancel.data",
  "cancel.optimizer",
  "cancel.all",
];

export const LeavingReasons = [
  { label: "cancel.billing", value: LeavingOptions.BILLING },
  { label: "cancel.features", value: LeavingOptions.FEATURES },
  { label: "cancel.expensive", value: LeavingOptions.EXPENSIVE },
  { label: "cancel.not_sure", value: LeavingOptions.NOT_SURE },
  { label: "cancel.other", value: LeavingOptions.OTHER },
];
