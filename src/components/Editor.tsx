import React from 'react';
import { View, StyleSheet, Animated, Dimensions, Image, Button } from 'react-native';
import { PanGestureHandler, PanGestureHandlerStateChangeEvent, State, PinchGestureHandler, PinchGestureHandlerStateChangeEvent, RotationGestureHandler, RotationGestureHandlerStateChangeEvent } from 'react-native-gesture-handler';
import { captureRef } from 'react-native-view-shot';
import * as RNFS from 'react-native-fs';
import { MyLottieModule } from '../nativeModules/MyLottieModule';

const { width, height } = Dimensions.get('window');

type EditorState = {};
type EditorProps = {
  url: string;
};

class Editor extends React.Component<EditorProps, EditorState> {
  snapshotRef = React.createRef<View>();
  panRef = React.createRef<PanGestureHandler>();
  rotationRef = React.createRef<RotationGestureHandler>();
  pinchRef = React.createRef<PinchGestureHandler>();

  _lastOffset: { x: number, y: number }
  translateX: Animated.Value;
  translateY: Animated.Value;

  _baseScale: Animated.Value;
  _pinchScale: Animated.Value;
  _lastScale: number;
  scale: Animated.AnimatedMultiplication;

  _rotateStr: Animated.AnimatedInterpolation;
  _lastRotate: number;
  rotate: Animated.Value;

  onGestureEvent: (...args: any[]) => void;
  onPinchGestureEvent: (...args: any[]) => void;
  onRotateGestureEvent: (...args: any[]) => void;

  constructor(props: EditorProps) {
    super(props);

    // pan
    this.translateX = new Animated.Value(0);
    this.translateY = new Animated.Value(0);
    this._lastOffset = { x: 0, y: 0 };
    this.onGestureEvent = Animated.event([
      {
        nativeEvent: {
          translationX: this.translateX,
          translationY: this.translateY
        }
      }
    ], { useNativeDriver: true });

    // scale
    this._baseScale = new Animated.Value(1);
    this._pinchScale = new Animated.Value(1);
    this._lastScale = 1;
    this.scale = Animated.multiply(this._baseScale, this._pinchScale);
    this.onPinchGestureEvent = Animated.event([
      {
        nativeEvent: {
          scale: this._pinchScale
        }
      }
    ], { useNativeDriver: true });

    // rotate
    this.rotate = new Animated.Value(0);
    this._rotateStr = this.rotate.interpolate({
      inputRange: [-100, 100],
      outputRange: ['-100rad', '100rad'],
    });
    this._lastRotate = 0;
    this.onRotateGestureEvent = Animated.event([
      {
        nativeEvent: { rotation: this.rotate }
      }
    ], { useNativeDriver: true });
  }

  onHandlerStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.oldState == State.ACTIVE) {
      this._lastOffset.x += event.nativeEvent.translationX;
      this._lastOffset.y += event.nativeEvent.translationY;

      this.translateX.setOffset(this._lastOffset.x);
      this.translateX.setValue(0);
      this.translateY.setOffset(this._lastOffset.y);
      this.translateY.setValue(0);
    }
  }

  onPinchHandlerStateChange = (event: PinchGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.oldState == State.ACTIVE) {
      this._lastScale *= event.nativeEvent.scale;
      this._baseScale.setValue(this._lastScale);
      this._pinchScale.setValue(1);
    }
  }

  onRotateHandlerStateChange = (event: RotationGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.oldState == State.ACTIVE) {
      this._lastRotate += event.nativeEvent.rotation;
      this.rotate.setOffset(this._lastRotate);
      this.rotate.setValue(0);
    }
  }

  processImage = async () => {
    const capture = await captureRef(this.snapshotRef, { format: "jpg", quality: 0.8 });
    const { uri: resizedCapture } = await MyLottieModule.resize(capture, 800, 800);
    const mask = "https://firebasestorage.googleapis.com/v0/b/swapstr-dev.appspot.com/o/media%2Fimages%2Fmask.png?alt=media&token=d27b8ae3-8201-4b69-9a84-6933b48c169b";
    const { uri: resizedMask } = await MyLottieModule.resize(mask, 800, 800);
    const { uri } = await MyLottieModule.mask(resizedCapture, resizedMask, { trimTransparency: false });
    const { uri: cropped, width, height } = await MyLottieModule.crop(uri, 200, 100, 400, 600);

    console.log(cropped, " ", width, " ", height);

    const facesPath = `${RNFS.DocumentDirectoryPath}/faces`
    await RNFS.mkdir(facesPath);

    // rename file    
    const renamed = `file://${facesPath}/placeholder.png`;
    await RNFS.moveFile(cropped, renamed);
    return renamed;
  }

  render() {
    return (
      <View style={styles.container}>
        <View collapsable={false} ref={this.snapshotRef}>
          <PanGestureHandler
            ref={this.panRef}
            onGestureEvent={this.onGestureEvent}
            onHandlerStateChange={this.onHandlerStateChange}>

            <Animated.View style={[
              {
                transform: [
                  { translateX: this.translateX, translateY: this.translateY }
                ]
              }
            ]}>
              <RotationGestureHandler
                ref={this.rotationRef}
                simultaneousHandlers={this.pinchRef}
                onGestureEvent={this.onRotateGestureEvent}
                onHandlerStateChange={this.onRotateHandlerStateChange}>

                <Animated.View>
                  <PinchGestureHandler
                    ref={this.pinchRef}
                    simultaneousHandlers={this.rotationRef}
                    onGestureEvent={this.onPinchGestureEvent}
                    onHandlerStateChange={this.onPinchHandlerStateChange}>

                    <Animated.View>
                      <Animated.Image style={[
                        styles.pinchableImage,
                        {
                          transform: [
                            { perspective: 200 },
                            { scale: this.scale },
                            { rotate: this._rotateStr }
                          ]
                        }
                      ]} source={{ uri: this.props.url }} />

                    </Animated.View>
                  </PinchGestureHandler>
                </Animated.View>

              </RotationGestureHandler>
            </Animated.View>
          </PanGestureHandler>
        </View>

        <View pointerEvents="none" style={styles.maskContainer}>
          <Image source={{ uri: "https://firebasestorage.googleapis.com/v0/b/swapstr-dev.appspot.com/o/media%2Fimages%2Foverlay.png?alt=media&token=a1c9c8f6-ef7b-47be-b863-8689a6ab9a18" }} style={styles.maskImage} />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    backgroundColor: "#000000",
    // alignItems: "center",
    // justifyContent: "center",
    width,
    height: width,
    overflow: "hidden"
  },
  pinchableImage: {
    // backgroundColor: "rgba(255,0,0,0.5)",
    height: width
  },
  maskContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // backgroundColor: "rgba(255,255,255,0.5)",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  maskImage: {    
    width: width,
    height: width,
  }
});

export default Editor;