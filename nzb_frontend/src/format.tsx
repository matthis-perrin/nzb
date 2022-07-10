export function toGigaBytes(bytes: number): string {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  const giga = bytes / 1024 ** 3;
  const gigaStr = giga.toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
  return `${gigaStr} GB`;
}

export function toMegaBytes(bytes: number): string {
  const mega = bytes / 1024 ** 2;
  const megaStr = mega.toLocaleString(undefined, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  });
  return `${megaStr} MB`;
}

export function toReleaseDate(ts?: number): string {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  return ts !== undefined ? new Date(ts).toDateString().slice(4) : 'Unknown release date';
}
