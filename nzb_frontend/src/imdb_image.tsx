import React, {useEffect, useState} from 'react';
import styled from 'styled-components';

import {asMapOrThrow, asStringOrThrow} from '../../shared/src/type_utils';
import {notifyError} from './errors';
import {CustomImg} from './react';

interface NzbDaemonStatusProps {
  imdbId: string;
  image: string | undefined;
}

export const ImdbImage: CustomImg<NzbDaemonStatusProps> = props => {
  const {imdbId, image, ...rest} = props;

  const [src, setSrc] = useState(image);
  useEffect(() => setSrc(image), [image]);
  useEffect(() => {
    if (image === undefined || image === '' || image.endsWith('nopicture.jpg')) {
      fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=36282fa0`)
        .then(async res => res.json())
        .then(res => setSrc(asStringOrThrow(asMapOrThrow(res).Poster)))
        .catch(err => {
          notifyError(`Failure to load alternative image for ${imdbId}`)(err);
        });
    }
  }, [image, imdbId]);

  return <Wrapper src={src} {...rest} />;
};
ImdbImage.displayName = 'ImdbImage';

const Wrapper = styled.img`
  background-color: #888;
`;
