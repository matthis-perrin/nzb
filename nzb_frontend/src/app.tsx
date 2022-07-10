import React, {Fragment, useCallback, useState} from 'react';
import styled from 'styled-components';

import {toMegaBytes} from './format';
import {LibraryTab} from './library_tab';
import {RecentMoviesTab} from './recent_movies_tab';
import {useDaemonData} from './stores';

interface Tab {
  label: string;
  component: React.FC;
}

const TABS: [Tab, ...Tab[]] = [
  {label: 'Library', component: LibraryTab},
  {label: 'Recent Movies', component: RecentMoviesTab},
];

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(TABS[0]);
  const {state} = useDaemonData();

  const handleTabClick = useCallback<React.MouseEventHandler>(evt => {
    const tab = TABS.find(t => t.label === evt.currentTarget.getAttribute('data-tab')) ?? TABS[0];
    setCurrentTab(tab);
  }, []);

  const downloadRate = state?.status.downloadRate;

  return (
    <Wrapper>
      {downloadRate === undefined ? (
        <Fragment />
      ) : (
        <DownloadRate>{`${toMegaBytes(downloadRate)}/s`}</DownloadRate>
      )}
      <Tabs>
        {TABS.map(tab => (
          <TabButton
            key={tab.label}
            data-tab={tab.label}
            selected={tab === currentTab}
            onClick={handleTabClick}
          >
            {tab.label}
          </TabButton>
        ))}
      </Tabs>
      <Content>
        <currentTab.component />
      </Content>
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

const TabButton = styled.div<{selected: boolean}>`
  padding: 8px 16px;
  cursor: pointer;
  background: #5c527f;
  outline: solid 2px ${p => (p.selected ? '#6E85B2' : 'none')};
`;

const Content = styled.div`
  width: 100%;
  flex-grow: 1;
`;

const DownloadRate = styled.div`
  position: fixed;
  bottom: 0;
  right: 0;
  padding: 8px 16px;
  background-color: #ffffff11;
  color: #ffffff66;
  border-top-left-radius: 4px;
`;
