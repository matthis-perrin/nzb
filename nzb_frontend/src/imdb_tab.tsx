import React, {useCallback, useEffect, useState} from 'react';
import styled from 'styled-components';

import {API_DOMAIN} from '../../shared/src/constant';
import {ImdbNzbInfoLight} from '../../shared/src/models';
import {asMapArrayOrThrow, asMapOrThrow} from '../../shared/src/type_utils';

function toGigaBytes(bytes: number): string {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  const giga = bytes / 1024 ** 3;
  const gigaStr = giga.toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
  return `${gigaStr}GB`;
}

export const ImdbTab: React.FC = () => {
  const [imdb, setImdb] = useState<ImdbNzbInfoLight[] | undefined>(undefined);

  useEffect(() => {
    fetch(`${API_DOMAIN}/get-imdb`, {method: 'POST', body: JSON.stringify({limit: 30})})
      .then(async res => res.json())
      .then(res =>
        setImdb(asMapArrayOrThrow(asMapOrThrow(res).items).map(item => item as ImdbNzbInfoLight))
      )
      .catch(console.error);
  }, []);

  const handleDownloadClick = useCallback<React.MouseEventHandler>(evt => {
    const nzbId = evt.currentTarget.getAttribute('data-nzb-id');
    // eslint-disable-next-line no-null/no-null
    if (nzbId === null) {
      return;
    }
    fetch(`${API_DOMAIN}/start-download`, {
      method: 'POST',
      body: JSON.stringify({accountId: 'matthis', nzbId}),
    }).catch(console.error);
  }, []);

  if (!imdb) {
    return <Wrapper>Loading...</Wrapper>;
  }

  return (
    <Wrapper>
      {imdb.map(m => (
        <ImdbTile key={m.bestNzbId}>
          <TileTop>
            <TileImage src={m.image} />
          </TileTop>
          <TileBottom>
            <TileTitle
              href={`https://www.imdb.com/title/${m.imdbId}/`}
              target="_blank"
              rel="noreferrer"
            >
              {m.title}
            </TileTitle>
            <TileBadges>
              <TileBadge>
                {m.releaseDate !== undefined
                  ? new Date(m.releaseDate).toDateString()
                  : 'Unknown release date'}
              </TileBadge>
              {m.genres.map(genre => (
                <TileBadge key={genre}>{genre}</TileBadge>
              ))}
            </TileBadges>
            <TilePlot>{m.plot}</TilePlot>
            <TileNzbs>
              <TileNzbsTitle>Best NZB file</TileNzbsTitle>
              <TileNzb>
                <TileNzbTitle>{m.bestNzbTitle}</TileNzbTitle>
                <TileNzbSize>{toGigaBytes(m.bestNzbSize)}</TileNzbSize>
              </TileNzb>
              <button type="button" data-nzb-id={m.bestNzbId} onClick={handleDownloadClick}>
                Download
              </button>
            </TileNzbs>
          </TileBottom>
        </ImdbTile>
      ))}
    </Wrapper>
  );
};
ImdbTab.displayName = 'ImdbTab';

const Wrapper = styled.div`
  color: #ddd;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ImdbTile = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  background-color: #ffffff22;
`;

const TileTop = styled.div`
  display: flex;
`;

const TileBottom = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 16px 16px 16px;
`;

const TileImage = styled.img`
  width: 100%;
  background-color: #888;
`;

const TileTitle = styled.a`
  font-size: 24px;
  font-weight: 500;
  text-align: center;
`;

const TileBadges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const TileBadge = styled.div`
  border-radius: 1000px;
  background-color: #ffffff22;
  padding: 6px 12px;
  font-size: 13px;
`;

const TilePlot = styled.div`
  text-align: justify;
  font-size: 15px;
`;

const TileNzbs = styled.div`
  display: flex;
  flex-direction: column;
`;

const TileNzbsTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #888;
`;

const TileNzb = styled.div`
  display: flex;
  align-items: baseline;
  gap: 4px;
`;

const TileNzbTitle = styled.div`
  flex-grow: 1;
  word-break: break-all;
  font-size: 14px;
`;

const TileNzbSize = styled(TileBadge)`
  flex-shrink: 0;
  border-radius: 1000px;
  background-color: #ffffff22;
  padding: 6px 10px;
  font-size: 13px;
`;
