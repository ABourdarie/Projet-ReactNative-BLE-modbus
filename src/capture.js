import ViewShot from "react-native-view-shot";

class ExampleCaptureOnMountManually extends Component {
  componentDidMount () {
    this.refs.viewShot.capture().then(uri => {
      console.log("do something with ", uri);
    });
  }
  render() {
    return (
      <ViewShot ref="viewShot" options={{ format: "jpg", quality: 0.9 }}>
        <Text>...Something to rasterize...</Text>
      </ViewShot>
    );
  }
}

// alternative
class ExampleCaptureOnMountSimpler extends Component {
  onCapture = uri => {
    console.log("do something with ", uri);
  }
  render() {
    return (
      <ViewShot onCapture={this.onCapture} captureMode="mount">
        <Text>...Something to rasterize...</Text>
      </ViewShot>
    );
  }
}

// waiting an image
class ExampleWaitingCapture extends Component {
  onImageLoad = () => {
    this.refs.viewShot.capture().then(uri => {
      console.log("do something with ", uri);
    })
  };
  render() {
    return (
      <ViewShot ref="viewShot">
        <Text>...Something to rasterize...</Text>
        <Image  onLoad={this.onImageLoad} />
      </ViewShot>
    );
  }
}

// capture ScrollView content
class ExampleCaptureScrollViewContent extends Component {
  onCapture = uri => {
    console.log("do something with ", uri);
  }
  render() {
    return (
      <ScrollView>
        <ViewShot onCapture={this.onCapture} captureMode="mount">
          <Text>...The Scroll View Content Goes Here...</Text>
        </ViewShot>
      </ScrollView>
    );
  }
}