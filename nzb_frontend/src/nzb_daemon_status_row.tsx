import React, {Fragment, useCallback} from 'react';
import styled from 'styled-components';

import {API_DOMAIN} from '../../shared/src/constant';
import {NzbDaemonStatus} from '../../shared/src/models';
import {toGigaBytes} from './format';

interface NzbDaemonStatusProps {
  nzb: NzbDaemonStatus;
}

const ONE_MEGABYTE = 1024 * 1024;

export const NzbDaemonStatusRow: React.FC<NzbDaemonStatusProps> = props => {
  const {nzb} = props;
  const {nzbId, nzbTitle, nzbSize, downloadStatus} = nzb;

  let info = <pre>{JSON.stringify(nzb, undefined, 2)}</pre>;

  const handleDeleteClick = useCallback(() => {
    fetch(`${API_DOMAIN}/delete-download`, {
      method: 'POST',
      body: JSON.stringify({accountId: 'matthis', nzbId}),
    }).catch(console.error);
  }, [nzbId]);

  if (downloadStatus === undefined) {
    info = (
      <div>
        {`Scheduled (${toGigaBytes(nzbSize)})`}
        <button type="button" onClick={handleDeleteClick}>
          Cancel
        </button>
      </div>
    );
  } else {
    const {status, inQueue, downloadedSizeMb, fileSizeMb} = downloadStatus;
    info = status.startsWith('SUCCESS') ? (
      <div>
        {`Downloaded (${toGigaBytes(nzbSize)})`}
        <button type="button" onClick={handleDeleteClick}>
          Delete
        </button>
      </div>
    ) : (
      <div>
        {`${status} (${toGigaBytes(downloadedSizeMb * ONE_MEGABYTE)}/${toGigaBytes(
          fileSizeMb * ONE_MEGABYTE
        )})`}
        {inQueue ? (
          <Fragment />
        ) : (
          <button type="button" onClick={handleDeleteClick}>
            Delete
          </button>
        )}
      </div>
    );
  }

  return (
    <Wrapper>
      <Title>{nzbTitle}</Title>
      {info}
    </Wrapper>
  );
};
NzbDaemonStatusRow.displayName = 'NzbDaemonStatusRow';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Title = styled.div`
  font-size: 13px;
  color: #ffffff88;
  word-break: break-all;
`;
