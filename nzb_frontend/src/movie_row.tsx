import React, {useEffect} from 'react';
import styled from 'styled-components';

import {NzbDaemonStatus} from '../../shared/src/models';
import {toGigaBytes, toReleaseDate} from './format';
import {ImdbImage} from './imdb_image';
import {NzbDaemonStatusRow} from './nzb_daemon_status_row';
import {fetchImdb, useImdbRegistry} from './stores';

interface MovieRowProps {
  imdbId: string;
  nzbs: [NzbDaemonStatus, ...NzbDaemonStatus[]];
}

export const MovieRow: React.FC<MovieRowProps> = props => {
  const {imdbId, nzbs} = props;

  const movie = useImdbRegistry().get(imdbId);

  useEffect(() => {
    if (movie === undefined) {
      fetchImdb(imdbId);
    }
  }, [imdbId, movie]);

  if (movie === undefined) {
    return <div>Loading...</div>;
  }

  const {image, title, releaseDate} = movie;

  return (
    <ImdbRow>
      <RowImage imdbId={imdbId} image={image} />
      <RowContent>
        <RowTitle href={`https://www.imdb.com/title/${imdbId}/`} target="_blank" rel="noreferrer">
          {title}
        </RowTitle>
        <RowBadges>
          <RowBadge>{toGigaBytes(nzbs[0].nzbSize)}</RowBadge>
          <RowBadge>{toReleaseDate(releaseDate)}</RowBadge>
        </RowBadges>
        {nzbs.map(nzb => (
          <NzbDaemonStatusRow key={nzb.nzbId} nzb={nzb} />
        ))}
      </RowContent>
    </ImdbRow>
  );
};
MovieRow.displayName = 'MovieRow';

const ImdbRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  background-color: #ffffff22;
`;

const RowImage = styled(ImdbImage)`
  width: 25%;
`;

const RowContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 0;
`;

const RowTitle = styled.a`
  font-size: 24px;
  font-weight: 500;
`;

const RowBadges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const RowBadge = styled.div`
  border-radius: 1000px;
  background-color: #ffffff22;
  padding: 6px 12px;
  font-size: 13px;
`;
