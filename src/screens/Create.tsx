import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-native';
import { Text, StyleSheet, View, Animated, Button, Image } from 'react-native';
import { getClip } from '../api/firestore/clips';
import LottieView from 'lottie-react-native';
import { RNFFmpeg } from 'react-native-ffmpeg';
import { MyLottieModule, MyLottie } from '../nativeModules/MyLottieModule';
import ViewShot from "react-native-view-shot";
import * as RNFS from 'react-native-fs';
// import Video from 'react-native-video';
import Canvas, { Image as CanvasImage, ImageData } from 'react-native-canvas';
import RNImageTools from 'react-native-image-tools-wm';

function Create({ navigation, route }: any) {
  const [clip, setClip] = useState<any>({
    id: null,
    title: null,
    videoUrl: null,
    animationUrl: null,
    frames: 0,
    fps: 0,
    keywords: [],
    thumbnailUrl: null,
    thumb: null,
    width: 0,
    height: 0
  });
  const [loading, setLoading] = useState(true);
  const [animationSource, setAnimationSource] = useState<any>(null);
  const [animation, setAnimation] = useState<any>(null);
  const [animProgress, setAnimProgress] = useState<any>(null);
  const myRef: any = useRef();
  const [img, setImg] = useState<any>(null);
  // const [source, setSource] = useState<any>(null);
  // const onCapture = useCallback((uri: any) => setSource({ uri }), []);

  const showToast = async () => {
    const msg = await MyLottieModule.doPromiseTask(1);
    MyLottieModule.showToast(msg, MyLottieModule.LONG);
  }

  const canvasRef = useRef<any>();
  const tempCanvasRef = useRef<any>();

  const updateImage = async (width: number, height: number) => {
    const outCanvas = canvasRef.current as Canvas;
    const tempCanvas = tempCanvasRef.current as Canvas;
    outCanvas.width = width;
    outCanvas.height = height;
    tempCanvas.width = width;
    tempCanvas.height = height;

    const videoImg = new CanvasImage(tempCanvas);
    const tmpContext = tempCanvas.getContext('2d');
    const base64 = await RNFS.readFile("file://" + RNFS.DocumentDirectoryPath + '/frame-0007.jpg', 'base64');
    videoImg.src = "data:image/jpg;base64," + base64;
    await new Promise((resolve, reject) => {
      videoImg.addEventListener('load', async () => {
        console.log('image is loaded');
        resolve();
      });
    });

    tmpContext.drawImage(videoImg, 0, height, width, height, 0, 0, width, height);

    // Converting matte image into alpha channel
    const tempImageData = await tmpContext.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = Object.values(tempImageData.data);
    const length = Object.keys(data).length;
    for (let i = 0; i < length; i += 4) {
      if (data[i] !== 255) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0;
      }
    }
    const imgData = new ImageData(outCanvas, data, width, height);

    const outCtx = outCanvas.getContext('2d');
    outCtx.putImageData(imgData, 0, 0);
    outCtx.globalCompositionOperation = "source-out";

    const videoImg2 = new CanvasImage(outCanvas);
    videoImg2.src = "data:image/jpg;base64," + base64;
    await new Promise((resolve, reject) => {
      videoImg2.addEventListener('load', async () => {
        console.log('image is loaded');
        resolve();
      });
    });
    outCtx.drawImage(videoImg2, 0, 0, width, height, 0, 0, width, height);
    outCtx.globalCompositionOperation = "destination-over";

    const uri = await myRef.current.capture();
    console.log(uri);
    const animImg = new CanvasImage(outCanvas);
    const animBase64 = await RNFS.readFile(uri, 'base64');
    animImg.src = "data:image/jpg;base64," + animBase64;
    await new Promise((resolve, reject) => {
      animImg.addEventListener('load', async () => {
        console.log('anim image is loaded');
        resolve();
      });
    });
    outCtx.drawImage(animImg, 0, 0, width, height);

    const url = await outCanvas.toDataURL();
    setImg(url);
    await RNFS.writeFile("file://" + RNFS.DocumentDirectoryPath + '/frame-0007.jpg', url.split("data:image/png;base64,")[1], 'base64');

    setTimeout(() => {
      setImg("file://" + RNFS.DocumentDirectoryPath + '/frame-0007.jpg');
      console.log("file://" + RNFS.DocumentDirectoryPath + '/frame-0007.jpg');
    }, 3000);
  }

  const startAnimation = async (anim: any) => {
    if (anim) {
      console.log(anim);
      setAnimation(anim);
      // setAnimProgress(new Animated.Value(7));
      console.log(anim.isMounted());

      if (myRef.current && anim.isMounted()) {
        const uri = await myRef.current.capture();
        setImg(uri);
      }
    }
  }

  const updateTest = async (anim: string, width: number, height: number) => {
    const imgPath = "file://" + RNFS.DocumentDirectoryPath + '/frame-0007.jpg';
    const { uri: mainImg } = await RNImageTools.crop(imgPath, 0, 0, width, height);
    const { uri: maskImg } = await RNImageTools.crop(imgPath, 0, height, width, height);
    const { uri: resImg } = await MyLottieModule.alphaMask(mainImg, maskImg, { trimTransparency: false });
    // const animImg = await myRef.current.capture();
    // Image.getSize(animImg, (width, height) => { console.log("width, height: ", width, height) }, () => {});
    const { uri: animImg } = await MyLottieModule.getLottieFrame(anim, width, height);
    const { uri: mergedImg } = await RNImageTools.merge([ animImg, resImg ]);
    console.log(animImg, mergedImg);
    setImg(mergedImg);
  }

  useEffect(() => {
    setLoading(true);

    const fetchData = async () => {
      let result: any = null;
      let data: any = null;

      if (route.params?.clip) {
        result = route.params.clip;
        setClip(result);

        // const response = await fetch("https://assets1.lottiefiles.com/packages/lf20_HvFfKv.json");
        const response = await fetch(result.animationUrl);
        data = await response.json();
        // const placeholderRes = await fetch("https://firebasestorage.googleapis.com/v0/b/swapstr-dev.appspot.com/o/media%2Fimages%2Fplaceholder.png?alt=media&token=57b92092-00d9-419d-bbb9-36ba4145ce59");
        // const blob = await placeholderRes.blob();
        // const placeholder = "data:image/png;base64," + blob;        
        // const paths = { file: "p", folder: "u", preserveAspectRatio: "pr" };
        // data.assets.forEach((asset: any) => {
        //   asset[paths.folder] = "";
        //   asset[paths.file] = placeholder; // Override image
        //   asset["e"] = 1;
        // });
        // console.log(data);
        setAnimationSource(data);
        // TODO: check ios support for RNFS.DocumentDirectoryPath
        // RNFFmpeg.execute(`-ss ${new Date(10/result.fps * 1000).toISOString().substr(11).split("Z")[0]} -i ${result.videoUrl} -vframes 1 -y ${RNFS.CachesDirectoryPath}/output.jpg`).then(result => {
        //   const path = "file://"+RNFS.CachesDirectoryPath+'/output.jpg'
        //   setImg(path);
        //   console.log("FFmpeg process exited with rc " + result.rc)
        // });

        const res = await RNFFmpeg.execute(`-i ${result.videoUrl} -y -r ${result.fps} ${RNFS.DocumentDirectoryPath}/frame-%04d.jpg`);
        console.log("FFmpeg process exited with rc " + res.rc)
        const path = "file://" + RNFS.DocumentDirectoryPath + '/frame-0007.jpg'
        setImg(path);

        // await updateTest(result.width, result.height);
        setAnimProgress(new Animated.Value(7 / result.fps));
      }

      setLoading(false);

      setTimeout(async () => {
        // await updateImage(result.width, result.height);
        await updateTest(JSON.stringify(data), result.width, result.height);
        // if (myRef.current) {
        //   const uri = await myRef.current.capture();
        //   // setImg(uri);
        // }
      }, 3000);
    }

    fetchData();
  }, [route.params?.clip]);

  return (
    <>
      <Text>{clip.id}</Text>
      <Text>{clip.title}</Text>
      {
        !loading ?
          (<View style={styles.container}>
            <Text>loaded</Text>
            <Image source={{ uri: img }} style={{ width: "100%", height: clip.height }} />
            {/* <Canvas ref={canvasRef} style={{ width: clip.width, height: clip.height }} />
            <Canvas ref={tempCanvasRef} style={{ width: clip.width, height: clip.height }} /> */}
            {/* <ViewShot ref={myRef} options={{ format: "png", quality: 0.9, width: clip.width, height: clip.height }}>
              <LottieView
                source={animationSource}
                imageAssetsFolder={'lottie/placeholder'}
                ref={setAnimation}
                progress={animProgress}
                style={{ width: clip.width, height: clip.height }}
              />
            </ViewShot> */}
            {/* <ViewShot onCapture={onCapture} captureMode="continuous" style={{ width: 300, height: 300 }}>
              <Video style={{ width: 300, height: 300 }} source={{ uri: clip.videoUrl }} volume={0} repeat />
            </ViewShot>

            <Text>above is a video and below is a continuous screenshot of it</Text>

            <Image fadeDuration={0} source={source} style={{ width: 300, height: 300 }} /> */}
          </View>) :
          <Text>loading...</Text>
      }
      {/* <Link to="/" style={styles.button}>
        <Text style={styles.text}>Share Video</Text>
      </Link>
      <MyLottie style={styles.bottom}></MyLottie>
      <Button onPress={showToast} title="Toast Btn" /> */}
      <MyLottie style={styles.bottom}></MyLottie>
    </>
  );
}

var styles = StyleSheet.create({
  container: {
    backgroundColor: "#aaaaaa",
  },
  button: {
    backgroundColor: "#f06060",
    padding: 10
  },
  text: {
    color: "#ffffff",
    textAlign: "center"
  },
  bottom: {
    width: "100%",
    height: 50
  }
});

export default Create;