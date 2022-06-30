import React, {useEffect, useState} from 'react';
import styled from 'styled-components';

import {API_DOMAIN} from '../../shared/src/constant';
import {NzbDaemonStatus} from '../../shared/src/models';
import {asMapArrayOrThrow, asMapOrThrow} from '../../shared/src/type_utils';

export const DaemonTab: React.FC = () => {
  const [movies, setMovies] = useState<NzbDaemonStatus[] | undefined>(undefined);

  useEffect(() => {
    fetch(`${API_DOMAIN}/get-state`, {method: 'POST', body: JSON.stringify({accountId: 'matthis'})})
      .then(async res => res.json())
      .then(res =>
        setMovies(asMapArrayOrThrow(asMapOrThrow(res).items).map(item => item as NzbDaemonStatus))
      )
      .catch(console.error);
  }, []);

  if (!movies) {
    return <Wrapper>Loading...</Wrapper>;
  }

  return (
    <Wrapper>
      {movies.map(m => (
        <div key={m.nzbId}>
          <pre>{JSON.stringify(m, undefined, 2)}</pre>
        </div>
      ))}
    </Wrapper>
  );
};
DaemonTab.displayName = 'DaemonTab';

const Wrapper = styled.div`
  color: white;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;
