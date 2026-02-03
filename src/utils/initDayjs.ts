import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import tz from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(tz);
dayjs.extend(isoWeek);

dayjs.tz.setDefault('Asia/Shanghai');
