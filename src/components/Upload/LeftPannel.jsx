import React from 'react';
import DocumentList from './DocumentList';

const LeftPanelContent = ({ refreshTrigger }) => (
    <>
        <DocumentList refreshTrigger={refreshTrigger} />
    </>
);

export default LeftPanelContent;