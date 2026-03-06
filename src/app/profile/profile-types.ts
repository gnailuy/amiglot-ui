export type ProfilePayload = {
  handle: string;
  birth_year?: number | null;
  birth_month?: number | null;
  country_code?: string | null;
  timezone: string;
  discoverable?: boolean;
};

export type LanguagePayload = {
  language_code: string;
  level: number;
  is_native: boolean;
  is_target: boolean;
  description?: string | null;
  order?: number;
};

export type AvailabilityPayload = {
  weekday: number;
  start_local_time: string;
  end_local_time: string;
  timezone: string;
  order?: number;
};

export type AvailabilityDraft = {
  weekdays: number[];
  start_local_time: string;
  end_local_time: string;
  timezone?: string;
};

export type ProfileResponse = {
  user: {
    id: string;
    email: string;
  };
  profile: ProfilePayload;
  languages: LanguagePayload[];
  availability: AvailabilityPayload[];
};

export type HandleCheckResponse = {
  available: boolean;
};
