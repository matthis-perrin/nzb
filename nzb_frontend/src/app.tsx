import React, {useCallback, useState} from 'react';
import styled from 'styled-components';

import {DaemonTab} from './daemon_tab';
import {ImdbTab} from './imdb_tab';

const TABS = ['Daemon', 'IMDB'] as const;

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>(TABS[0]);

  const handleTabClick = useCallback<React.MouseEventHandler>(evt => {
    const tab = evt.currentTarget.getAttribute('data-tab') ?? TABS[0];
    setCurrentTab(tab);
  }, []);

  return (
    <Wrapper>
      <Tabs>
        {TABS.map(tab => (
          <Tab key={tab} data-tab={tab} selected={tab === currentTab} onClick={handleTabClick}>
            {tab}
          </Tab>
        ))}
      </Tabs>
      <Content>{currentTab === 'Daemon' ? <DaemonTab /> : <ImdbTab />}</Content>
    </Wrapper>
  );
};
App.displayName = 'App';

const Wrapper = styled.div`
  height: 100%;
  background-color: #000;
  color: black;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Tabs = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px;
`;

const Tab = styled.div<{selected: boolean}>`
  padding: 8px 16px;
  cursor: pointer;
  background: #5c527f;
  outline: solid 2px ${p => (p.selected ? '#6E85B2' : 'none')};
`;

const Content = styled.div`
  width: 100%;
  flex-grow: 1;
`;
