import React, {ReactNode, useEffect} from 'react';
import styled from 'styled-components';

import {toGigaBytes, toReleaseDate} from './format';
import {ImdbImage} from './imdb_image';
import {fetchImdb, useImdbRegistry} from './stores';

interface MovieTileProps {
  imdbId: string;
  children: ReactNode;
}

export const MovieTile: React.FC<MovieTileProps> = props => {
  const {imdbId, children} = props;

  const movie = useImdbRegistry().get(imdbId);

  useEffect(() => {
    if (movie === undefined) {
      fetchImdb(imdbId);
    }
  }, [imdbId, movie]);

  if (movie === undefined) {
    return <div>Loading...</div>;
  }

  const {image, title, releaseDate, genres, plot, bestNzbTitle, bestNzbSize} = movie;

  return (
    <ImdbTile>
      <TileTop>
        <TileImage imdbId={imdbId} image={image} />
      </TileTop>
      <TileBottom>
        <TileTitle href={`https://www.imdb.com/title/${imdbId}/`} target="_blank" rel="noreferrer">
          {title}
        </TileTitle>
        <TileBadges>
          <TileBadge>{toReleaseDate(releaseDate)}</TileBadge>
          {genres.map(genre => (
            <TileBadge key={genre}>{genre}</TileBadge>
          ))}
        </TileBadges>
        <TilePlot>{plot}</TilePlot>
        <TileNzbs>
          <TileNzbsTitle>Best NZB file</TileNzbsTitle>
          <TileNzb>
            <TileNzbTitle>{bestNzbTitle}</TileNzbTitle>
            <TileNzbSize>{toGigaBytes(bestNzbSize)}</TileNzbSize>
          </TileNzb>
          {children}
          {/* <button type="button" data-nzb-id={bestNzbId} onClick={handleDownloadClick}>
            Download
          </button> */}
        </TileNzbs>
      </TileBottom>
    </ImdbTile>
  );
};
MovieTile.displayName = 'MovieTile';

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

const TileImage = styled(ImdbImage)`
  width: 100%;
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
