import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FolderIcon from '@mui/icons-material/Folder';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import { TreeItemCheckbox, TreeItemContent, TreeItemGroupTransition, TreeItemIconContainer, TreeItemLabel, TreeItemRoot } from '@mui/x-tree-view/TreeItem';
import { SimpleTreeView, TreeItemIcon, TreeItemProvider, useTreeItem } from '@mui/x-tree-view';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFolderFiles, setSelectedFolderId } from '../../redux/folderSlice';
import { addFolder, fetchTreeData } from '../../redux/treeSlice';



const CustomTreeItem = React.forwardRef(function CustomTreeItem(props, ref) {
  const { id, itemId, label, disabled, children, ...other } = props;

  const {
    getContextProviderProps,
    getRootProps,
    getContentProps,
    getIconContainerProps,
    getCheckboxProps,
    getLabelProps,
    getGroupTransitionProps,
    status,
  } = useTreeItem({ id, itemId, children, label, disabled, rootRef: ref });

  return (
    <TreeItemProvider {...getContextProviderProps()}>
      <TreeItemRoot {...getRootProps(other)}>
        <TreeItemContent {...getContentProps()}>
          <TreeItemIconContainer {...getIconContainerProps()}>
            <TreeItemIcon status={status} />
          </TreeItemIconContainer>
          <TreeItemCheckbox {...getCheckboxProps()} />
          <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
            <FolderIcon sx={{
              color: "purple"
            }} />
            <TreeItemLabel {...getLabelProps()} />
          </Box>
        </TreeItemContent>
        {children && <TreeItemGroupTransition {...getGroupTransitionProps()}>
          {children}
        </TreeItemGroupTransition>
        }
      </TreeItemRoot>
    </TreeItemProvider>
  );
});


// Recursive Tree Renderer
const renderTree = (nodes) =>
  nodes.map((node) => (
    <CustomTreeItem
      key={node.id}
      itemId={node.id}
      label={node.labelText}
      labelIcon={node.icon}

    >
      {node.children && renderTree(node.children)}
    </CustomTreeItem >
  ));

export default function NitTreeView() {

  const [selected, setSelected] = React.useState(null);
  const [newFolderName, setNewFolderName] = React.useState('');
  const [idCounter, setIdCounter] = React.useState(100);
  const dispatch = useDispatch();
  const { treeData } = useSelector((state) => state.tree);

  React.useEffect(() => {
    dispatch(fetchTreeData());
  }, [dispatch]);

  const handleAddFolder = () => {
    debugger
    if (!newFolderName || !selected) return;

    const newId = idCounter.toString();
    const newFolder = {
      id: newId,
      labelText: newFolderName,
      icon: FolderIcon,
    };

    // const addFolderToNode = (nodes) => {
    //   return nodes.map((node) => {
    //     if (node.id === selected) {
    //       const updatedChildren = node.children ? [...node.children, newFolder] : [newFolder];
    //       return { ...node, children: updatedChildren };
    //     } else if (node.children) {
    //       return { ...node, children: addFolderToNode(node.children) };
    //     }
    //     return node;
    //   });
    // };

    // dispatch(addFolder({
    //   parentId: selected,
    //   newFolder: {
    //     id: idCounter.toString(),
    //     labelText: newFolderName,
    //     icon: FolderIcon,
    //   }
    // }));

    dispatch(addFolder({ parentId: selected, newFolder }));

    setIdCounter((prev) => prev + 1);
    setNewFolderName('');
  };

  const handleSelect = (event, nodeId) => {
    setSelected(nodeId)
    dispatch(setSelectedFolderId(nodeId));
    dispatch(fetchFolderFiles(nodeId));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          size="small"
          label="New Folder"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
        />
        <Button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-md cursor-pointer" onClick={handleAddFolder}>
          Add Folder
        </Button>
      </Box>
      <SimpleTreeView
        selectedItems={selected ? [selected] : []}
        onSelectedItemsChange={handleSelect}
        defaultCollapseIcon={<ArrowDropDownIcon />}
        defaultExpandIcon={<ArrowRightIcon />}
        sx={{ height: 400, flexGrow: 1, maxWidth: 400, overflow: "auto" }}

      >
        {renderTree(treeData)}
      </SimpleTreeView >
    </Box>
  );
}
