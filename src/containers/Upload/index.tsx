import React from "react";
import styles from "./style.scss";
import { TextField, Button, Box, Typography } from "@material-ui/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Papa from "papaparse";
import { useHistory } from "react-router-dom";
import { useRecoilState, useSetRecoilState } from "recoil";
import { sourceState, matrixState, transformationConfigState } from "../../state";
import config from "../../config";

const exampleFile = config.exampleCsv
  ? new File([new Blob([config.exampleCsv], { type: "text/csv" })], "example.csv")
  : undefined;

interface Props {}
export const Step = 1;
const parseCSV: (input: File) => Promise<Papa.ParseResult<string[]>> = (input) => {
  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(input, {
      error: (e) => {
        reject(e);
      },
      worker: true,
      complete: (results) => {
        resolve(results);
      },
      skipEmptyLines: "greedy",
    });
  });
};
const Upload: React.FC<Props> = ({}) => {
  const history = useHistory();

  const [error, setError] = React.useState<string>();
  const [errorDownloadUrl, setErrorDownloadUrl] = React.useState<string>();
  const [parsedSource, setParsedSource] = useRecoilState(matrixState);
  const [downloadUrl, setDownloadUrl] = React.useState<URL>();
  const [source, setSource] = useRecoilState(sourceState);

  const setTransformationConfig = useSetRecoilState(transformationConfigState);

  const setDownloadUrlFromString = (url: string) => {
    try {
      setDownloadUrl(new URL(url));
      setErrorDownloadUrl(undefined);
    } catch (e) {
      return setErrorDownloadUrl("Looks like an invalid URL.");
    }
  };

  const downloadCsv = async () => {
    setErrorDownloadUrl(undefined);
    if (!downloadUrl) return;
    await fetch(downloadUrl.toString())
      .then((res) => res.text())
      .then((data) => console.log(data))
      .catch((reason) => {
        setErrorDownloadUrl(reason.toString());
      });
  };

  const sourceText =
    (source && (typeof source === "string" ? "Input selected" : `Current file: ${source.name}`)) || "No file selected";
  const handleCsvParse = (sourceFile: File) => {
    setSource(sourceFile);
    setTransformationConfig((state) => {
      return { ...state, sourceFileName: sourceFile.name };
    });
    setError(undefined);
    parseCSV(sourceFile)
      .then((parseResults) => {
        setParsedSource(parseResults.data);
        setTransformationConfig((state) => {
          return {
            ...state,
            key: undefined,
            csvProps: {
              delimiter: parseResults.meta.delimiter,
            },
            columnConfiguration: parseResults.data[0].map((header) => {
              return { columnName: header };
            }),
          };
        });
        history.push(`/${Step + 1}`);
      })
      .catch((e) => {
        setError(e.message);
      });
  };
  return (
    <>
      <div className={styles.button}>
        <Typography variant="body1" gutterBottom>
          {sourceText}
        </Typography>
        <input
          id="csv-upload"
          type="file"
          className={styles.input}
          onChange={(event) => {
            if (event.target.files && event.target.files.length === 1) {
              const sourceFile = event.target.files[0];
              handleCsvParse(sourceFile);
            } else {
              setError(
                event.target.files && event.target.files.length > 0
                  ? "You can only upload one file"
                  : "No files selected"
              );
            }
          }}
          accept="text/csv"
        />
        <label htmlFor="csv-upload">
          <Button component="span" variant="contained" startIcon={<FontAwesomeIcon icon="upload" />}>
            Load your CSV File
          </Button>
          {error && <Typography color="error">No file selected</Typography>}
        </label>
        {exampleFile && (
          <Typography style={{ paddingTop: "1rem" }}>
            Or try it with an{" "}
            <a
              style={{ cursor: "pointer" }}
              onClick={() => {
                handleCsvParse(exampleFile);
              }}
            >
              example CSV file
            </a>
          </Typography>
        )}
      </div>
      <div className={styles.button}>
        <Typography style={{ paddingTop: "2rem" }}></Typography>
        <label>Or load CSV from URL:</label>
        <Typography style={{ width: "500px" }}>
          <TextField
            fullWidth
            id="csv-url"
            type="url"
            value={downloadUrl}
            onChange={(event) => {
              setDownloadUrlFromString(event.currentTarget.value);
            }}
          />
        </Typography>

        <p>
          <Button
            component="span"
            variant="contained"
            startIcon={<FontAwesomeIcon icon="download" />}
            disabled={!downloadUrl}
            onClick={() => {
              downloadCsv();
            }}
          >
            Download CSV file
          </Button>
          {errorDownloadUrl && <Typography color="error">{errorDownloadUrl}</Typography>}
        </p>
      </div>

      <Box>
        <Button disabled className={styles.actionButtons}>
          Back
        </Button>
        <Button
          className={styles.actionButtons}
          variant="contained"
          color="primary"
          disabled={!parsedSource}
          onClick={() => history.push(`/${Step + 1}`)}
        >
          Next
        </Button>
      </Box>
    </>
  );
};
export default Upload;
