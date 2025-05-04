import dayjs from 'dayjs';

export default function TimestampRender(value) {
    return value ? dayjs(value.toString().length === 10 ? value * 1000 : value).fromNow() : ''
}