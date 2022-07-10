import React, {useEffect} from 'react';
import styled from 'styled-components';

import {NzbDaemonStatus, NzbDaemonTargetState} from '../../shared/src/models';
import {neverHappens} from '../../shared/src/type_utils';
import {MovieRow} from './movie_row';
import {refreshDaemonDataWithPromise, useDaemonData} from './stores';

const AUTO_REFRESH_PERIOD = 2 * 1000;

function targetStateToOrder(targetState: NzbDaemonTargetState): number {
  if (targetState === 'force-download') {
    return 0;
  } else if (targetState === 'download') {
    return 1;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  } else if (targetState === 'delete') {
    return 2;
  }
  neverHappens(targetState, `Unknown TargetState "${targetState}"`);
}

export const LibraryTab: React.FC = () => {
  const {state} = useDaemonData();

  useEffect(() => {
    let timeout = 0;
    let isMounted = true;
    function refresh(): void {
      refreshDaemonDataWithPromise().finally(() => {
        if (isMounted) {
          timeout = setTimeout(refresh, AUTO_REFRESH_PERIOD);
        }
      });
    }
    refresh();
    return () => {
      clearTimeout(timeout);
      isMounted = false;
    };
  }, []);

  if (!state) {
    return <Wrapper>Loading...</Wrapper>;
  }

  const nzbByImdbId = new Map<string, [NzbDaemonStatus, ...NzbDaemonStatus[]]>();
  for (const nzb of state.nzb) {
    nzbByImdbId.set(nzb.imdbId, [...(nzbByImdbId.get(nzb.imdbId) ?? []), nzb]);
  }
  const movies = [...nzbByImdbId.entries()].map(
    ([imdbId, nzbs]) =>
      [
        imdbId,
        nzbs.sort((nzb1, nzb2) => {
          const diff = targetStateToOrder(nzb1.targetState) - targetStateToOrder(nzb2.targetState);
          if (diff !== 0) {
            return diff;
          }
          return nzb2.nzbPubTs - nzb1.nzbPubTs;
        }),
      ] as const
  );

  return (
    <Wrapper>
      {/* {isLoading ? <Reloading>Reloading...</Reloading> : <Fragment />} */}
      {movies.map(([imdbId, nzbs]) => (
        <MovieRow key={imdbId} imdbId={imdbId} nzbs={nzbs} />
      ))}
    </Wrapper>
  );
};
LibraryTab.displayName = 'LibraryTab';

const Wrapper = styled.div`
  color: white;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

// const Reloading = styled.div`
//   position: fixed;
//   top: 4px;
//   right: 4px;
//   color: #ffffff66;
//   font-size: 13px;
// `;
