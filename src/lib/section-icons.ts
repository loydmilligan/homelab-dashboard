import appMark64 from '../../generated/icons/shost_app_mark_64x64.png';
import crets64 from '../../generated/icons/crets_64x64.png';
import crets128 from '../../generated/icons/crets_128x128.png';
import hosts64 from '../../generated/icons/hosts_64x64.png';
import hosts128 from '../../generated/icons/hosts_128x128.png';
import overview64 from '../../generated/icons/overview_64x64.png';
import overview128 from '../../generated/icons/overview_128x128.png';
import settings64 from '../../generated/icons/settings_64x64.png';
import settings128 from '../../generated/icons/settings_128x128.png';
import shots64 from '../../generated/icons/shots_64x64.png';
import shots128 from '../../generated/icons/shots_128x128.png';
import stows64 from '../../generated/icons/stows_64x64.png';
import stows128 from '../../generated/icons/stows_128x128.png';
import tracs64 from '../../generated/icons/tracs_64x64.png';
import tracs128 from '../../generated/icons/tracs_128x128.png';
import wallboard64 from '../../generated/icons/wallboard_64x64.png';
import wapps64 from '../../generated/icons/wapps_64x64.png';
import wapps128 from '../../generated/icons/wapps_128x128.png';
import works64 from '../../generated/icons/works_64x64.png';
import works128 from '../../generated/icons/works_128x128.png';
import yots64 from '../../generated/icons/yots_64x64.png';
import yots128 from '../../generated/icons/yots_128x128.png';

export type SectionIconKey =
  | 'overview'
  | 'hosts'
  | 'wapps'
  | 'works'
  | 'yots'
  | 'stows'
  | 'shots'
  | 'tracs'
  | 'crets'
  | 'settings'
  | 'wallboard'
  | 'app_mark';

export const sectionIcons = {
  overview: { nav: overview64, hero: overview128, alt: 'Overview icon' },
  hosts: { nav: hosts64, hero: hosts128, alt: 'Hosts icon' },
  wapps: { nav: wapps64, hero: wapps128, alt: 'Wapps icon' },
  works: { nav: works64, hero: works128, alt: 'Works icon' },
  yots: { nav: yots64, hero: yots128, alt: 'Yots icon' },
  stows: { nav: stows64, hero: stows128, alt: 'Stows icon' },
  shots: { nav: shots64, hero: shots128, alt: 'Shots icon' },
  tracs: { nav: tracs64, hero: tracs128, alt: 'Tracs icon' },
  crets: { nav: crets64, hero: crets128, alt: 'Crets icon' },
  settings: { nav: settings64, hero: settings128, alt: 'Settings icon' },
  wallboard: { nav: wallboard64, hero: wallboard64, alt: 'Wallboard icon' },
  app_mark: { nav: appMark64, hero: appMark64, alt: 'Shost app mark' },
} satisfies Record<SectionIconKey, { nav: string; hero: string; alt: string }>;
