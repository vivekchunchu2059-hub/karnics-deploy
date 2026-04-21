import React from 'react';
import {
  PageContainer,
  PageHeader,
  PageHeaderLeft,
  PageIconWrapper,
  PageTitle,
  PageHeaderRight,
  MainCard,
  MainCardContent,
} from './PageLayoutStyles';

export interface PageLayoutProps {
  /** Page title shown next to the icon */
  title: string;
  /** Icon element (e.g. MUI icon) shown on the left */
  icon: React.ReactNode;
  /** Content on the right side of the header (search bar, filters, buttons) */
  headerRight?: React.ReactNode;
  /** Main content; will be wrapped in a card */
  children: React.ReactNode;
  /** Optional: disable card wrapper (e.g. for full-bleed content) */
  noCard?: boolean;
  /** Optional: override card content padding (e.g. "16px" for tighter layout) */
  contentPadding?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  icon,
  headerRight,
  children,
  noCard = false,
  contentPadding,
}) => {
  return (
    <PageContainer sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <PageHeader sx={{ flexShrink: 0 }}>
        <PageHeaderLeft>
          <PageIconWrapper>{icon}</PageIconWrapper>
          <PageTitle variant="h1">
            {title}
          </PageTitle>
        </PageHeaderLeft>
        {headerRight && <PageHeaderRight>{headerRight}</PageHeaderRight>}
      </PageHeader>
      {noCard ? (
        children
      ) : (
        <MainCard>
          <MainCardContent sx={contentPadding ? { padding: contentPadding } : undefined}>
            {children}
          </MainCardContent>
        </MainCard>
      )}
    </PageContainer>
  );
};

export default PageLayout;
