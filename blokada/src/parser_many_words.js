const fs = require("fs").promises
const path = require("path")
const mammoth = require("mammoth")
const request = require("request")

const baseDir = "D:\\Work\\RMH\\WOW\\touch\\"

async function getAllFilesRecursive(dir) {
  let output = []
  const files = await fs.readdir(dir)
  for (const file of files) {
    const fullPath = path.resolve(dir, file)
    const stat = await fs.lstat(fullPath)
    if (stat.isDirectory()) {
      output = [...output, ...await getAllFilesRecursive(fullPath)]
      continue
    }
    output.push(fullPath)
  }
  return output
}

async function getAllDirectories(dir) {
  let dirs = []
  for (const file of await fs.readdir(dir)) {
    if ((await fs.lstat(path.resolve(dir, file))).isDirectory()) {
      dirs = [...dirs, file]
    }
  }
  return dirs
}

function typograf(text) {
  return new Promise(resolve => {
    request.post({
      url: "http://www.typograf.ru/webservice/",
      form: {
        text,
        chr: "UTF-8",
      }
    }, function(err, _, body) {
      if (err) {
        console.error(`Typograf error: ${err}`)
        resolve("")
        return
      }
      resolve(body)
    })
  })
}

void async function main() {

  const directories = await getAllDirectories(__dirname)
  console.log(directories)

  const output = []
  for (const dir of directories) {
    const dirData = path.resolve(__dirname, dir)
    console.log(dirData)
    const files = await getAllFilesRecursive(dirData)
    const docxFiles = files.filter(fullPath => path.extname(fullPath) === ".docx")
    const imgFiles = files.filter(fullPath => (path.extname(fullPath) === ".jpg" || path.extname(fullPath) === ".png"))

    const filesOutput = []
    for (const file of docxFiles) {
      const {value: content} = await mammoth.convertToHtml({path: file})
      const data = path.parse(file)

      const tpContent = await typograf(content)

      const outObj = {
        ...data,
        directory: /[^\/\\]+$/.exec(data.dir)[0].replace(/\\+/g,'/'),
        tpContent,
      }
      filesOutput.push(outObj)
    }

    let personName = ""
    let imageOutput = {}
    for (const file of imgFiles) {
      const imgData = path.parse(file)
      personName = imgData.name
      imageOutput = {
        ...imgData,
        directory: path.relative(baseDir, imgData.dir).replace(/\\+/g,'/')
      }
    }

    const outObj = {
      name: personName,
      directory: path.relative(baseDir, dirData).replace(/\\+/g,'/'),
      filesOutput,
      imageOutput
    }
    output.push(outObj)
  }

  const outputFile = path.resolve(__dirname, "output.json")
  await fs.writeFile(outputFile, JSON.stringify(output, null, 2))
}()
