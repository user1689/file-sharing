import { useState } from "react";
import { UploadComponent, UploadFile } from "./UploadComponent/UploadComponent";
import "./index.css";
import { DownLoadComponent } from "./DownLoadComponent/DownLoadComponent";

function App() {
    const defaultFileList: UploadFile[] | undefined = [];

    const onProgress = (p: any, f: any) => {
        // console.log(p, f);
    };
    const onSuccess = (resp: any, f: any) => {
        // console.log(f);
        setKeyList((p) => {
            return [f.name, ...p];
        });
        // console.log(resp, f);
    };
    const onError = (e: any, f: any) => {
        // console.log(e, f);
    };
    const onChange = (f: any) => {};
    const checkSize = (file: any) => {
        if (file && file instanceof File) {
            if (file.size / 1024 > 1000) {
                alert("file size is too large");
                return false;
            }
            return true;
        }
    };
    const renameFile = (file: File) => {
        if (file && file instanceof File) {
            let newFile: File;
            if (file.name.length > 20) {
                const newFileName = file.name.substring(0, 20);
                newFile = new File([file], newFileName + "...", {
                    type: file.type,
                });
            } else {
                newFile = file;
            }
            const p = new Promise<File>((res, rej) => {
                res(newFile);
            });
            return p;
        }
        return false;
    };

    const [keyList, setKeyList] = useState<string[]>([]);

    const handleClick = (e : any) => {
        navigator.clipboard.writeText(e.target.value);
    };

    return (
        <div className="App">
            <div className="wrapper">
                <div className="top">
                    <DownLoadComponent/>
                </div>
                <div className="bottom">
                    <div className="left">
                        <UploadComponent
                            defaultFileList={defaultFileList}
                            beforeUpload={renameFile}
                            onError={onError}
                            onProgress={onProgress}
                            onSuccess={onSuccess}
                            onChange={onChange}
                            multiple={true}
                            accept={".png"}
                            drag={true}
                            originalBorderColor={"white"}
                            dragOverBorderColor={"#ade6e6"}
                            loadingBarColor={"#ade6e6"}
                            dragOverBgColor={"#90909042"}
                            dropBoxWidth={"200px"}
                        >
                            {/* pass your own icon or content here */}
                            <p>Click or Drag file over to upload</p>
                        </UploadComponent>
                    </div>
                    <div className="right">
                        <span>"Click to copy you link for sharing"</span>
                        {keyList.map((e, k) => (
                            <span className="link-list" key={k}>
                                <input readOnly className="link" value={e} onClick={handleClick} />
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
