const showMessage = (ctx, text) => {
  ctx.document.showMessage(text);
}

function runSquash(context, files, hidden) {
  if (!files.length) return;

  const workspace = NSWorkspace.sharedWorkspace();
  const bundleIdentifier = 'com.realmacsoftware.squash';
  const appURL = workspace.URLForApplicationWithBundleIdentifier(bundleIdentifier);
  if (!appURL) {
    showMessage(context, 'Squash not installed');
    workspace.openURL(NSURL.URLWithString('https://realmacsoftware.com/squash/?sketch'));
    return;
  }

  let flags = NSWorkspaceLaunchWithoutAddingToRecents | NSWorkspaceLaunchAsync;
  if (hidden) {
    flags = flags | NSWorkspaceLaunchWithoutActivation | NSWorkspaceLaunchAndHide;
  }

  workspace.openURLs_withAppBundleIdentifier_options_additionalEventParamDescriptor_launchIdentifiers_(files, bundleIdentifier, flags, null, null);
  workspace.openURLs_withAppBundleIdentifier_options_additionalEventParamDescriptor_launchIdentifiers_(files, bundleIdentifier, flags, null, null);
}

function getURLsToCompress(exportedAssets) {
  const urlsToCompress = [];
  exportedAssets.forEach((asset) => {
    if (NSFileManager.defaultManager().fileExistsAtPath(asset.path)) {
      urlsToCompress.push(NSURL.fileURLWithPath(asset.path));
    }
  });
  return urlsToCompress;
}

function openFileDialog(path) {
  const openDlg = NSOpenPanel.openPanel();
  openDlg.setTitle('Export & Optimize All Assets In...');
  openDlg.setCanChooseFiles(false);
  openDlg.setCanChooseDirectories(true);
  openDlg.allowsMultipleSelection = false;
  openDlg.setCanCreateDirectories(true);
  openDlg.setPrompt('Export');
  if (path) {
    openDlg.setDirectoryURL(path);
  }
  const buttonClicked = openDlg.runModal();
  if (buttonClicked === NSOKButton) {
    return openDlg.URLs().firstObject().path();
  }
  return null;
}

function exportAndCompress(context) {
  const potentialExports = context.document.allExportableLayers();
  if (!potentialExports.count()) {
    showMessage(context, 'No exportable layers in the document');
  }
  showMessage(context, 'Exporting assets to Squash');
  const exportFolder = openFileDialog();
  if (exportFolder) {
    // TODO: If there's any exportable layer selected, only export those. Otherwise, export everything under the sun
    const exports = NSMutableArray.alloc().init();
    potentialExports.forEach((file) => {
      const requests = MSExportRequest.exportRequestsFromExportableLayer(file);
      if (!requests.count()) return;
      requests.forEach((request) => {
        const path = NSString.pathWithComponents([exportFolder, `${request.name()}.${request.format()}`]);
        exports.addObject({ request, path });
      });
    });

    // First we'll need to actually export the assets
    exports.forEach((file) => {
      if (file.request.format() !== 'svg') {
        const render = MSExporter.exporterForRequest_colorSpace(file.request, NSColorSpace.sRGBColorSpace());
        render.data().writeToFile_atomically(file.path, true);

        const urlsToCompress = getURLsToCompress(exports);
        if (urlsToCompress.length > 0) {
          runSquash(context, urlsToCompress, false);
        } else {
          coscript.setShouldKeepAround(false);
        }
      }
    });
  }
}


export default exportAndCompress;
