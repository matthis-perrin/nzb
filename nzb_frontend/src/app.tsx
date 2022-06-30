import React, {useEffect, useState} from 'react';
import styled from 'styled-components';

import {ImdbNzbInfo} from '../../shared/src/models';
import {asMapArrayOrThrow, asMapOrThrow} from '../../shared/src/type_utils';

const DOMAIN =
  process.env.NODE_ENV === 'production'
    ? 'https://59erydl5c5.execute-api.eu-west-3.amazonaws.com/prod'
    : 'http://localhost:7777';

export const App: React.FC = () => {
  const [movies, setMovies] = useState<ImdbNzbInfo[] | undefined>(undefined);

  useEffect(() => {
    fetch(`${DOMAIN}/refresh-state`, {method: 'POST'})
      .then(async res => res.json())
      .then(res =>
        setMovies(asMapArrayOrThrow(asMapOrThrow(res).items).map(item => item as ImdbNzbInfo))
      )
      .catch(err => alert(err));
  }, []);

  if (movies === undefined) {
    return <Wrapper>Loading...</Wrapper>;
  }

  return (
    <Wrapper>
      {movies.map(m => (
        <div key={m.imdbId}>
          <div>
            <b>imdbId: </b>
            {m.imdbId}
          </div>
          <div>
            <b>bestNzbTitle: </b>
            {m.bestNzbTitle}
          </div>
          <div>
            <b>bestNzbId: </b>
            {m.bestNzbId}
          </div>
          <div>
            <b>bestNzbSize: </b>
            {m.bestNzbSize}
          </div>
          <div>
            <b>bestNzbDate: </b>
            {new Date(m.bestNzbDate).toString()}
          </div>
          <div>
            <b>title: </b>
            {m.title}
          </div>
          <div>
            <b>releaseDate: </b>
            {new Date(m.releaseDate ?? 0).toString()}
          </div>
          <pre>{JSON.stringify(m, undefined, 2)}</pre>
        </div>
      ))}
    </Wrapper>
  );
};
App.displayName = 'App';

const Wrapper = styled.div`
  background-color: #eee;
  color: black;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;
