const electron = require('electron')
const { remote, screen, dialog } = electron
const { app, BrowserWindow } = remote

const _ = require('underscore-plus')
_.extend(_, require('lodash'))

_.templateSettings.interpolate = /#{([\s\S]+?)}/g

const fs = remote.require('fs-plus')

import path from 'path'
import raf from 'raf'
import now from 'performance-now'

let userPath = path.join(app.getAppPath(), '/user')
if (!fs.existsSync(userPath)) {
  fs.makeTreeSync(userPath)
}

let IS_WIN = /^win/.test(process.platform)
let IS_OSX = process.platform === 'darwin'
let IS_LINUX = process.platform === 'linux'
let dirs = {
  build: __dirname,
  cwd: app.getAppPath(),
  home: app.getPath('home'),
  app: app.getPath('appData'),
  user: userPath,
  tmp: app.getPath('temp'),
  root: app.getPath('exe'),
  node_modules: path.join(userPath, 'node_modules'),
  user_pkg: path.join(userPath, 'package.json'),
}

let p = (...args) => path.join(__dirname, ...args)

let name = app.getName()
let version = app.getVersion()

let openFile = (...args) => {
  try {
    return dialog.showOpenDialog.apply(dialog, args)
  }
  catch (err) {
    console.error(err)
  }
  return null
}

let saveFile = (...args) => {
  try {
    return dialog.showSaveDialog.apply(dialog, args)
  }
  catch (err) {
    console.error(err)
  }
  return null
}

let messageBox = (...args) => {
  try {
    return dialog.showMessageBox.apply(dialog, args)
  }
  catch (err) {
    console.error(err)
  }
  return null
}

export {
  _,
  p,
  name,
  version,
  electron,
  dialog,
  openFile,
  saveFile,
  messageBox,
  remote,
  screen,
  BrowserWindow,
  app,
  fs,
  path,
  userPath,
  IS_WIN,
  IS_OSX,
  IS_LINUX,
  dirs,
  raf,
  now,
}
