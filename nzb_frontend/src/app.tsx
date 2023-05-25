import React, {useCallback, useState} from 'react';
import styled from 'styled-components';

export const App: React.FC = () => {
  const [counter, setCounter] = useState(0);

  const handleClick = useCallback(() => {
    setCounter(c => {
      if (c > 2) {
        throw new Error('Too much');
      }
      return c + 1;
    });
  }, []);

  return <Wrapper onClick={handleClick}>{`App ${counter}`}</Wrapper>;
};
App.displayName = 'App';

const Wrapper = styled.div`
  width: 200px;
  height: 400px;
  background-color: #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
`;
