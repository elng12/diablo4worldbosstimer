export type AnalyticsEventName =
  | 'view_timer_page'
  | 'return_visit_timer_page'
  | 'click_remind_me'
  | 'select_reminder_5min'
  | 'select_reminder_15min'
  | 'select_reminder_30min'
  | 'select_reminder_60min'
  | 'click_view_map'
  | 'click_report_wrong_time'
  | 'submit_error_report'
  | 'faq_expand';

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

type AnalyticsWindow = Window & {
  gtag?: (command: 'event', eventName: string, params?: AnalyticsProperties) => void;
  plausible?: (eventName: string, options?: { props?: AnalyticsProperties }) => void;
  umami?: {
    track?: (eventName: string, properties?: AnalyticsProperties) => void;
  };
};

export function trackAnalyticsEvent(
  eventName: AnalyticsEventName,
  properties: AnalyticsProperties = {},
) {
  if (typeof window === 'undefined') return;

  const analyticsWindow = window as AnalyticsWindow;
  analyticsWindow.gtag?.('event', eventName, properties);
  analyticsWindow.plausible?.(eventName, { props: properties });
  analyticsWindow.umami?.track?.(eventName, properties);
  window.dispatchEvent(
    new CustomEvent('worldBossAnalytics', {
      detail: { eventName, properties },
    }),
  );
}
