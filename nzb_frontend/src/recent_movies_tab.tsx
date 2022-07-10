import React, {useCallback} from 'react';
import styled from 'styled-components';

import {API_DOMAIN} from '../../shared/src/constant';
import {MovieTile} from './movie_tile';
import {refreshImdbData, useImdbData} from './stores';

export const RecentMoviesTab: React.FC = () => {
  const {state, isLoading} = useImdbData();

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

  const handleReloadClick = useCallback(refreshImdbData, []);

  if (!state && isLoading) {
    return <Wrapper>Loading...</Wrapper>;
  }

  return (
    <Wrapper>
      {state ? (
        state.movies.map(m => (
          <MovieTile key={m.bestNzbId} imdbId={m.imdbId}>
            <button type="button" data-nzb-id={m.bestNzbId} onClick={handleDownloadClick}>
              Download
            </button>
          </MovieTile>
        ))
      ) : (
        <FailureMessage>
          Failure to load movies{' '}
          <button type="button" onClick={handleReloadClick}>
            try again
          </button>
        </FailureMessage>
      )}
    </Wrapper>
  );
};
RecentMoviesTab.displayName = 'RecentMoviesTab';

const Wrapper = styled.div`
  color: #ddd;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FailureMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  height: 64px;
  background-color: #ffffff11;
`;
