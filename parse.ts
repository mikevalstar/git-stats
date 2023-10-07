import dayjs from 'dayjs';
import fs from 'fs';
import path from 'path';

type TTokeiFile = Record<
  string,
  {
    comments: number;
    blanks: number;
    code: number;
  }
>;
type timeseriesOutput = {
  date: string;
  languages: Record<
    string,
    {
      comments: number;
      blanks: number;
      code: number;
    }
  >;
};
type output = {
  languages: Array<string>;
  timeseries: Array<timeseriesOutput>;
  dates: Array<string>;
  dataCode: Record<string, Array<number>>;
  dataComments: Record<string, Array<number>>;
  dataBlanks: Record<string, Array<number>>;
};

// output dist directory
const outDir = path.join(__dirname, 'dist');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
}

// Read out the files in the working directory
const workingDir = path.join(__dirname, 'working');
const files = fs.readdirSync(workingDir);
files.sort().reverse();

// loop through files and get last file for each date
// file format is: 2023-06-04T12:04:27-7e42aebc55d6689fb9f5b1cd09804cc82fad41dd.json

const firstRecord = files[files.length - 1]!.split('T')[0];
const lastRecord = files[0]!.split('T')[0];
const dateCount: Record<string, number> = {};

const filesByDate = new Map<string, string>();
for (const file of files) {
  const date = file.split('T')[0];
  if (!date) {
    continue;
  }

  // for commit graph
  dateCount[date] = (dateCount[date] || 0) + 1;

  const existing = filesByDate.get(date);
  if (!existing) {
    filesByDate.set(date, file);
  }
}

const fileListReduced = Array.from(filesByDate.values());
fileListReduced.sort();

// Output Top Chart
const out = {
  languages: [],
  timeseries: [],
  dates: [],
  dataCode: {},
  dataComments: {},
  dataBlanks: {},
} as output;
const outLanguages = new Set<string>();

// Loop through and read each file
for (const file of fileListReduced) {
  const filePath = path.join(workingDir, file);
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  const parsed = JSON.parse(fileContent) as TTokeiFile;
  const date = file.split('T')[0];

  if (!date) continue;

  const languages = Object.keys(parsed);
  languages.forEach(outLanguages.add, outLanguages);

  const record: timeseriesOutput = {
    date,
    languages: {},
  };

  for (const language of languages) {
    if (parsed[language]) {
      record.languages[language] = {
        comments: parsed[language]!.comments,
        blanks: parsed[language]!.blanks,
        code: parsed[language]!.code,
      };
    }
  }

  out.timeseries.push(record);
}

out.languages = Array.from(outLanguages);

// Set the final time series data
// we did not do this on the original loop due to some languages possibly not being present in any given file
out.dates = out.timeseries.map((t) => t.date);

for (const rec of out.timeseries) {
  for (const lang of out.languages) {
    out.dataCode[lang] = out.dataCode[lang] || [];
    out.dataComments[lang] = out.dataComments[lang] || [];
    out.dataBlanks[lang] = out.dataBlanks[lang] || [];

    out.dataCode[lang]!.push(rec.languages[lang]?.code || 0);
    out.dataComments[lang]!.push(rec.languages[lang]?.comments || 0);
    out.dataBlanks[lang]!.push(rec.languages[lang]?.blanks || 0);
  }
}

// output the output file
const outFile = path.join(outDir, 'results.json');
fs.writeFileSync(outFile, JSON.stringify(out, null, 2));

// output the commit graph
const commitGraph = {
  dates: [] as Array<string>,
  data: [] as Array<{ x: number; y: number; v: number }>,
};

const start = dayjs(firstRecord).day(0); // sunday start
const end = dayjs(lastRecord).day(6); // saturday end

// walk every day between start and end
let current = start.clone();
let col = 0;
while (current.isBefore(end)) {
  const date = current.format('YYYY-MM-DD');
  if (current.day() === 0) {
    commitGraph.dates.push(date);
    col += 1;
  }
  commitGraph.data.push({
    v: dateCount[date] || 0,
    x: col,
    y: current.day(),
  });
  current = current.add(1, 'day');
}

const commitGraphFile = path.join(outDir, 'commits.json');
fs.writeFileSync(commitGraphFile, JSON.stringify(commitGraph, null, 2));

//force copy stats.js and index.html into folder
fs.copyFileSync(
  path.join(__dirname, 'stats.js'),
  path.join(outDir, 'stats.js')
);
fs.copyFileSync(
  path.join(__dirname, 'index.html'),
  path.join(outDir, 'index.html')
);

console.log('Results written to dist folder');
