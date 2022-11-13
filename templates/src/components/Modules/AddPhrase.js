import React from 'react'
import { Button, Form, FormGroup, Label, Input, Row, Col, Alert, CustomInput } from 'reactstrap';
import axios from 'axios';
import MicRecorder from 'mic-recorder-to-mp3';

class AddPhrase extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
			phFront: "",
            phBack: "",  

            selectedImgFile: null, //file location of the picture selected
			selectedAudioFile: null, //file location of the audio selected

			imgLabel: "Pick an image for the term", 
            audioLabel: "Pick an audio for the term",
            
            Mp3Recorder: new MicRecorder({ bitRate: 128 }),

            isRecording: false,
            blobURL: '',
            isBlocked: false,
            disable: true,
            file: null,

			didUpload: false,
        };
    }

    componentDidMount() {
        // navigator.getUserMedia({ audio: true },

        try {
            console.log("currently not working in production because getUserMedia CANNOT be run over unsecure netowrk...we need SSL.")

            navigator.mediaDevices.getUserMedia({ audio: true },
                () => {
                    console.log('Permission Granted');
                    this.setState({ isBlocked: false });
                },
                () => {
                    console.log('Permission Denied');
                    this.setState({ isBlocked: true })
                },
            );

        } catch (err) {
            console.log("couldnt find mic.")
            console.log("currently not working in production because getUserMedia CANNOT be run over unsecure netowrk...we need SSL.")
            console.log(err)
        }

        // navigator.mediaDevices.getUserMedia({ audio: true },
        //     () => {
        //         console.log('Permission Granted');
        //         this.setState({ isBlocked: false });
        //     },
        //     () => {
        //         console.log('Permission Denied');
        //         this.setState({ isBlocked: true })
        //     },
        // );

    }

    start = () => {
        if (this.state.isBlocked) {
            console.log('Permission Denied');
        } else {
            this.state.Mp3Recorder
            .start()
            .then(() => {
                this.setState({ isRecording: true });
            }).catch((e) => console.error(e));

            // this.state.disable = true
            this.setState({ disable: true });
        }
    }

    stop = () => {
        this.state.Mp3Recorder
        .stop()
        .getMp3()
        .then(([buffer, blob]) => {
            const blobURL = URL.createObjectURL(blob)
            this.setState({ blobURL, isRecording: false });

            const moduleIdentifier = document.getElementById('module-name').textContent.replace(/\s+/g, '-').toLowerCase();
            const phraseName = document.getElementById('phFront').value.replace(/\s+/g, '-').toLowerCase();

            // this.state.file = new File(buffer, `phrase_${moduleIdentifier}_${phraseName}.mp3`, {
            //     type: blob.type,
            //     lastModified: Date.now()
            // });
            this.setState({
                file: new File(buffer, `phrase_${moduleIdentifier}_${phraseName}.mp3`, { type: blob.type, lastModified: Date.now() }) 
            })
            
            console.log(this.state.file)
            
            
        }).catch((e) => console.log(e));
        
        // this.state.disable = false
        this.setState({ disable: false });
    }
    
    upload = () => {
        this.state.selectedAudioFile = this.state.file
        // this.setState({ selectedAudioFile: this.file })
        
		this.setState({ didUpload: true });

        document.getElementById('phAudioFile').disabled = true;

        console.log(this.state.selectedAudioFile)
    }

    submitPhrase = (event) => {
		if (this.state.phFront.length !== 0 && this.state.phBack.length !== 0)
		{   
			event.preventDefault();
			const data = new FormData();    
			let header = {
				headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') }
            };

			//required fields for adding a phrase
			data.append('front', this.state.phFront); 
			data.append('back', this.state.phBack); 
			data.append('moduleID', this.props.curModule.moduleID); 
            data.append('language', this.props.curModule.language); 
            //the type of a term must be PH in order to added as a phrase in the backend, so this will be hardcoded 
            data.append('type', "PH");  

            if (this.props.permissionLevel === "ta")
                data.append('groupID', this.props.currentClass.value);
            
            //optional fields for adding a phrase 
			if (this.state.selectedImgFile !== null || this.state.selectedImgFile !== undefined)
				data.append('image', this.state.selectedImgFile);

			if (this.state.selectedAudioFile !== null || this.state.selectedAudioFile !== undefined)
                data.append('audio', this.state.selectedAudioFile);
            
            console.log(this.state.selectedAudioFile)
            console.log(this.props.serviceIP)

			axios.post(this.props.serviceIP + '/term', data, header)
            .then(res => {
                this.resetFields(); 
                this.props.updateCurrentModule({ module: this.props.curModule });
            }) 
            .catch(function (error) {
                console.log("submitPhrase error: ", error.response);
            });
        } 
        else {
			event.preventDefault();
			alert("Please fill all inputs!");
		}
    }

    resetFields = () => {
        this.setState({
            phFront: "",
            phBack: "",  

            selectedImgFile: null, 
			selectedAudioFile: null, 

			imgLabel: "Pick an image for the term", 
			audioLabel: "Pick an audio for the term",
        });
    }

    imgFileChangedHandler = (event) => {
        this.setState({
            selectedImgFile: event.target.files[0],
            imgLabel: event.target.files[0] === undefined ? "Pick an image for the term" : event.target.files[0].name
        });
    }

    audioFileChangedHandler = (event) => {
        this.setState({
            selectedAudioFile: event.target.files[0],
            audioLabel: event.target.files[0] === undefined ? "Pick an audio for the term" : event.target.files[0].name
        });
    }

    change(e) {
        this.setState({
            [e.target.name]: e.target.value
        });
    }

    render () {
        return (
            <div>
            <Form onSubmit={e => this.submitPhrase(e)}>
            <Alert color='none' style={{color: '#004085', backgroundColor: 'lightskyblue', border: "none"}}>
                <Row>
                    <Col>
                        <FormGroup>
                            <Label for="phFront">Phrase (English):</Label>
                            <Input type="text"
                            name="phFront"
                            onChange={e => this.change(e)}
                            value={this.state.phFront}
                            id="phFront"
                            placeholder="Phrase in English"
                            autoComplete="off" />
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <FormGroup>
                            <Label for="phBack">Phrase (Translated):</Label>
                            <Input type="text"
                            name="phBack"
                            onChange={e => this.change(e)}
                            value={this.state.phBack}
                            id="phBack"
                            placeholder="Phrase Translated"
                            autoComplete="off" />
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
				<Col>
					<FormGroup>
						<Label for="phImgFile">
							Image:
						</Label>

						<CustomInput 
                        type="file" 
                        accept=".png, .jpg, .jpeg" 
						id="phImgFile" 
						label={this.state.imgLabel} 
						onChange={this.imgFileChangedHandler}
						/>
					</FormGroup>
				</Col>
				
				<Col>
					<FormGroup>
						<Label for="phAudioFile">
							Audio:
						</Label>
                        <br></br>
                        <div style={{paddingBottom: '5px', display: 'flex',  justifyContent:'center', alignItems:'center'}}>
                            <button type="button" onClick={this.start} disabled={this.state.isRecording} style={{border: "none", margin: '5px'}}>
                                Record
                            </button>
                            <button type="button" onClick={this.stop} disabled={!this.state.isRecording} style={{border: "none", margin: '5px'}}>
                                Stop
                            </button>

                            <button type="button" onClick={this.upload} disabled={this.state.disable} style={{border: "none", margin: '5px'}}>
                                Upload
                            </button>
                        </div>

						{this.state.didUpload ? <div style={{color: 'red', paddingBottom: '5px', display: 'flex',  justifyContent:'center', alignItems:'center', fontSize: '12px'}}>Successfully uploaded recorded audio file!</div> : '' }  

                        <div style={{paddingBottom: '5px', display: 'flex',  justifyContent:'center', alignItems:'center'}}>
                            <audio src={this.state.blobURL} controls="controls" />
                        </div>
                        
						<CustomInput 
                            type="file"
                            accept=".ogg, .wav, .mp3" 
							id="phAudioFile" 
							label={this.state.audioLabel} 
							onChange={this.audioFileChangedHandler}
						/>
					</FormGroup>
				</Col>
                </Row>
                <Row>
                    <Col>
                        <Button style={{backgroundColor: '#004085', border: "none"}} type="submit" block>
                            Create
                        </Button>
                        <Button style={{backgroundColor: 'steelblue', border: "none"}} onClick={() => this.props.setOpenForm(0)} block>
                            Cancel
                        </Button>
                    </Col>
                </Row>
            </Alert>
            </Form>
            </div>
        )
    }
}

export default AddPhrase