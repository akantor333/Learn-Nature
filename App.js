import React, { useState } from 'react';
import {
	Image,
	ScrollView,
	Linking,
	Modal,
	Alert,
	Dimensions
} from 'react-native';
import {
	Text,
	View,
	Button,
	AnimatedImage,
	Card
} from 'react-native-ui-lib';
import MapView from 'react-native-maps';
import * as Progress from 'react-native-progress';
import AsyncStorage from '@react-native-community/async-storage';
import { MaterialIcons, FontAwesome5, Ionicons, AntDesign } from '@expo/vector-icons';
import * as Permissions from 'expo-permissions'
import * as ImagePicker from 'expo-image-picker'
import Environment from './config/environment.js';
import sampledata from './sample.json';
import styles from './Stylesheet.js';
import placeholder from './resources/images/placeholder.png';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';
import { TouchableOpacity } from 'react-native-gesture-handler';

//----------------------------State----------------------------//
export default class App extends React.Component {
	// Static state variables
	state = {
		imageBase64: null,
		uploading: false,
		plantidResponse: null,
		trefleResponse: null,
		latitude: null,
		longitude: null,
		page: "welcome",
		suggestion: null,
		complexity: null,
		wikidata: null,
		advancedChallenge: null,
		intermediateChallange: null,
		noviceChallenge: null,
		intermediateChallangeSoFar: [null, null, null, null],
		noviceChallengeSoFar: [null, null, null, null],
		advancedChallengeSoFar: [null, null, null, null],
		useridentifications: null,
		allowsave: true,
		lastchallengeid: null,
		challengeCompleteModalDisplay: false,
		challengeComplete: false,
		userlevel: { level: null, xp: null },
		levelup: false,
		windowWidth: null,
		windowHeight: null,
		isTakenAsPhoto: false
	};
	//----------------------------Startup----------------------------//
	async componentDidMount() {
		// Ask Permissions
		await Permissions.askAsync(Permissions.CAMERA_ROLL);
		await Permissions.askAsync(Permissions.CAMERA);
		await Permissions.askAsync(Permissions.LOCATION);

		// Get user device size
		this.setState({ windowWidth: Dimensions.get('window').width, windowHeight: Dimensions.get('window').height })

		// Get current location
		console.log(await Location.hasServicesEnabledAsync());
		try {
			if (await Location.hasServicesEnabledAsync()) {
				let location = await Location.getCurrentPositionAsync();
				this.setState({ latitude: location.coords.latitude, longitude: location.coords.longitude });
			}
		} catch (error) {
			console.log(error + " [Error getting location]");
		}
		// Get user file system/save state and create new if not found
		this._maybeCreateFileSystem().then(() =>
			this.retrieveData().then(() => {
				// Send user to Welcome page, and to Complexity selection page if not selected
				if (this.state.complexity == null) {
					this.setState({ page: "complexity" })
				} else (
					this.setState({ page: "welcome" })
				)
				console.log("Current Complexity:", this.state.complexity);
			}));

	}

	//----------------------------Render----------------------------//
	render() {
		let { } = this.state;
		return (
			<View style={styles.container}>
				<ScrollView
					style={styles.container}
					contentContainerStyle={styles.contentContainer}
				>
					{this.displayUserLevel()}
					{this._maybeRenderImageUpload()}
					{this._maybeRenderWelcome()}
					{this._maybeRenderChallenge()}
					{this._maybeRenderFinalDisplay()}
					{this._maybeRenderNotRightSelection()}
					{this._maybeRenderComplexity()}
					{this._maybeRenderUserIdentifications()}
					{this._maybeRenderSettings()}

					{/*Modal for notifying the user if challenge is complete*/}
					<Modal style={styles.challengeCompleteModal}
						animationType="slide"
						transparent={true}
						visible={this.state.challengeCompleteModalDisplay}>
						<View style={styles.challengeCompleteModalView}>
							{this.state.challengeComplete ?
								<Text style={styles.challengeCompleteModalViewText}>You completed all challenges!</Text>
								:
								<Text style={styles.challengeCompleteModalViewText}>You completed a challenge!</Text>}
							{this.state.levelup ?
								<Text style={styles.challengeCompleteModalViewText}>Level up! {this.state.userlevel.level - 1} -`{`>`}` {this.state.userlevel.level}</Text>
								: null}
							{this.displayChallenges()}
							<Button
								backgroundColor="#3D03A8"
								label="Nice!"
								labelStyle={{ fontWeight: '600' }}
								onPress={() => this.setState({ challengeCompleteModalDisplay: false })}
								style={styles.challengeCompleteModalViewButton}
								enableShadow
							/>
						</View>
					</Modal>
				</ScrollView>
				{this.renderNavigation()}
			</View>
		);
	}
	//----------------------------Buttons for image upload----------------------------//
	_maybeRenderImageUpload = () => {
		if (this.state.page == "welcome") {
			return (
				<View style={styles.uploadContent}>
					<TouchableOpacity style={styles.uploadButton} onPress={this._pickImage}>
						<FontAwesome5 name="image" size={this.state.windowWidth / 20} color="#3D03A8" />
						<Text style={styles.uploadButtonText}>Upload image</Text>
					</TouchableOpacity>
					<TouchableOpacity style={styles.uploadButton} onPress={this._takePhoto}>
						<FontAwesome5 name="camera" size={this.state.windowWidth / 20} color="#3D03A8" />
						<Text style={styles.uploadButtonText}>Take a picture</Text>
					</TouchableOpacity>
				</View>
			)
		}
	}
	//---------------------------- Bottom Navigation----------------------------//
	renderNavigation = () => {
		return (
			<View style={styles.bottomNavigation}>
				<TouchableOpacity style={styles.bottomNavigationButton} onPress={() => this.setState({ page: 'welcome' })}>
					<FontAwesome5 name="home" size={this.state.windowWidth / 10} color="#3D03A8" />
					<Text style={styles.bottomNavigationText}>Home</Text>
				</TouchableOpacity>

				<TouchableOpacity style={styles.bottomNavigationButton} onPress={() => this.setState({ page: 'challenge' })}>
					<FontAwesome5 name="medal" size={this.state.windowWidth / 10} color="#3D03A8" />
					<Text style={styles.bottomNavigationText}>Challenges</Text>
				</TouchableOpacity>

				<TouchableOpacity style={styles.bottomNavigationButton} onPress={() => this.retrieveUserIdentificationsData().then(this.setState({ page: 'useridentifications', allowsave: false }))}>
					<FontAwesome5 name="leaf" size={this.state.windowWidth / 10} color="#3D03A8" />
					<Text style={styles.bottomNavigationText}>Saved</Text>
				</TouchableOpacity>

			</View>
		)
	}


	//----------------------------------------------------------------------------------------------------------------//
	//----------------------------------------------------------------------------------------------------------------//
	//-----------------------------------------------------[Pages]----------------------------------------------------//
	//----------------------------------------------------------------------------------------------------------------//
	//----------------------------------------------------------------------------------------------------------------//



	//----------------------------[Page] for viewing challenges----------------------------//
	_maybeRenderChallenge = () => {
		if (this.state.page == "challenge") {
			return (
				<View style={styles.challengePage}>
					<Button
						backgroundColor="#3D03A8"
						label="Create New Challenge"
						labelStyle={{ fontWeight: '600' }}
						onPress={() => this.generateChallenge()}
						style={{ margin: 20 }}
						enableShadow
					/>
					{this.state.challengeComplete ?
						<Text style={styles.text}>You completed all Challenges! Create a new challenge to gain XP and continue!</Text>
						: null}
					{this.state.complexity == 'advanced' && this.state.advancedChallenge != null ?
						<Text>Find and take a picture of the following plant Genus</Text>
						: this.state.complexity == 'advanced' && this.state.advancedChallenge == null ?
							<Text>Create a new random challenge to level up!</Text> : null
					}
					{this.state.complexity == 'intermediate' && this.state.intermediateChallange != null ?
						<Text>Find 4 plants with the following requirements: {this.state.intermediateChallange[2]} of {this.state.intermediateChallange[1]}</Text>
						: this.state.complexity == 'intermediate' && this.state.intermediateChallange == null ?
							<Text>Create a new random challenge to level up!</Text> : null
					}
					{this.state.complexity == 'novice' && this.state.noviceChallenge != null ?
						<Text>Find 4 plants that {this.state.noviceChallenge[2]} {this.state.noviceChallenge[1]}</Text>
						: this.state.complexity == 'novice' && this.state.noviceChallenge == null ?
							<Text>Create a new random challenge to level up!</Text> : null
					}
					{this.displayChallenges()}
				</View>
			)
		}
	}

	//----------------------------[Page] for settings----------------------------//
	_maybeRenderSettings = () => {
		if (this.state.page == "settings") {
			return (
				<View style={styles.challengePage}>
					<TouchableOpacity style={styles.button}
						onPress={() => this.setState({ page: 'complexity' })}>
						<Text style={styles.buttonText}>Change Complexity</Text>
					</TouchableOpacity>
					<TouchableOpacity style={styles.button}
						onPress={() => {
							Alert.alert(
								"Are you sure?",
								"This can't be reversed. All saved identifications and challenge progress data will be permenantly erased",
								[
									{
										text: "Cancel",
										onPress: () => console.log("Cancel Pressed"),
										style: "cancel"
									},
									{ text: "OK", onPress: () => this.deleteUserData }
								],
								{ cancelable: false }
							);
						}}>
						<Text style={styles.buttonText}>Delete saved data</Text>
					</TouchableOpacity>
				</View>
			)
		}
	}

	//----------------------------[Page] for selecting different identification----------------------------//
	_maybeRenderNotRightSelection = () => {
		if (this.state.page == "notright") {
			return (
				<View style={styles.notrightContainer}>
					<Text style={{ margin: 20 }}>The detection is not always right. Please select the right flower from the selections below based off their confidence levels</Text>

					{this.state.plantidResponse.suggestions.map(suggestion => (
						<View style={styles.notrightIndividualContainer} key={suggestion.id}>
							<Card
								style={{ backgroundColor: 'lightgray', alignItems: 'center' }}
								onPress={() => { this.setState({ suggestion: suggestion, page: "final" }); this.submitToTrefle() }}>
								<Image style={styles.resultImage} source={{ uri: suggestion.similar_images[0].url }} />
								{this.generateStars(suggestion.probability)}
							</Card>
						</View>
					))}

				</View>
			)
		}
	}

	//----------------------------[Page] Welcome----------------------------//
	_maybeRenderWelcome = () => {
		if (this.state.page == "welcome") {
			return (
				<View style={styles.mainContainer}>
					<Text style={styles.welcomeText}>Welcome to Learn Nature</Text>
					<Text style={styles.welcomeText}>Take a picture of a plant to identify it</Text>
					<TouchableOpacity style={styles.settingsButton} onPress={() => this.setState({ page: 'settings' })}>
						<MaterialIcons name="settings" size={this.state.windowWidth / 10} color="#3D03A8" />
						<Text style={styles.bottomNavigationText}>Settings</Text>
					</TouchableOpacity>
				</View>
			)
		}
	}
	//----------------------------[Page] for user stored identifications----------------------------//
	_maybeRenderUserIdentifications = () => {
		if (this.state.page == "useridentifications" && this.state.useridentifications != null) {
			return (
				<View style={styles.mainContainer}>
					{this.state.latitude != null && this.state.longitude != null?
					<MapView
						provider={MapView.PROVIDER_GOOGLE}
						style={styles.map}
						mapType={'satellite'}
						showsUserLocation={true}
						followsUserLocation={true}
						region={{ latitude: this.state.latitude, longitude: this.state.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
						>
						{this.state.useridentifications.map(data => (
							<MapView.Marker
								coordinate={{ latitude: data.location.latitude, longitude: data.location.longitude }}
								title={data.common_name}
								onPress={() => this.setState({ trefleResponse: data, page: "final", imageBase64: data.userimage })} />
						))}
					</MapView>
					:null}
					{this.state.useridentifications.map(data => (
						<View key={data.useridentificationid} style={styles.savedView}>
							<Card
								style={styles.savedCard}
							>
								<Text style={styles.savedCardTitle}>{data.common_name}</Text>
								<TouchableOpacity onPress={() => this.setState({ trefleResponse: data, page: "final", imageBase64: data.userimage })}>
									<Image style={styles.savedImage} source={{ uri: `data:image/png;base64,,${data.userimage.base64}` }} />
								</TouchableOpacity>
							</Card>
						</View>
					))}
				</View>
			)
		}
	}



	//----------------------------[Page] for user complexity selection----------------------------//
	_maybeRenderComplexity = () => {
		if (this.state.page == "complexity") {
			return (
				<View style={styles.mainContainer}>
					<Text>Results are displayed according to 3 different complexity levels. Please choose your desired one below</Text>
					<Text style={{ marginTop: '10%' }}>Recommended for children</Text>
					<TouchableOpacity style={styles.button}
						onPress={() => { this.storeComplexity("novice"); this.setState({ complexity: "novice", page: "welcome" }) }}>
						<Text style={styles.buttonText}>Novice</Text>
					</TouchableOpacity>
					<Text style={{ marginTop: 100 }}>Recommended for teenagers</Text>
					<TouchableOpacity style={styles.button}
						onPress={() => { this.storeComplexity("intermediate"); this.setState({ complexity: "intermediate", page: "welcome" }) }}>
						<Text style={styles.buttonText}>Intermediate</Text>
					</TouchableOpacity>
					<Text style={{ marginTop: 100 }}>Recommended for adults</Text>
					<TouchableOpacity style={styles.button}
						onPress={() => { this.storeComplexity("advanced"); this.setState({ complexity: "advanced", page: "welcome" }) }}>
						<Text style={styles.buttonText}>Advanced</Text>
					</TouchableOpacity>
				</View>
			)
		}
	}
	//----------------------------[Page] for after submission to Plant.id and Trefle----------------------------//
	_maybeRenderFinalDisplay = () => {
		if (this.state.complexity != null && this.state.page == "final" && this.state.trefleResponse != null) {
			return (
				// Display for all complexities
				<View style={styles.mainContainer}>
					<AnimatedImage
						source={this.state.imageBase64}
						style={styles.resultUserImage} />
					<View style={styles.finalDisplayTopContainer}>
						{this.state.plantidResponse != null ?
							<TouchableOpacity
								style={styles.finalDisplayButtons}
								onPress={() => this.setState({ page: "notright" })}>
								<AntDesign name="exclamationcircle" size={this.state.windowWidth / 20} color="#3D03A8" />
								<Text style={styles.finalDisplayButtonsText}>This isn't right!</Text>
							</TouchableOpacity>
							: null}
						{this.state.allowsave ?
							<TouchableOpacity
								style={styles.finalDisplayButtons}
								onPress={() => { this.storeIdentification(); this.setState({ allowsave: false }) }}>
								<FontAwesome5 name="save" size={this.state.windowWidth / 20} color="#3D03A8" />
								<Text style={styles.finalDisplayButtonsText}>Save</Text>
							</TouchableOpacity>
							: null}
						{this.state.plantidResponse != null ?
							<TouchableOpacity
								style={styles.finalDisplayButtons}
								onPress={() => Linking.openURL(this.state.suggestion.plant_details.url)}>
								<FontAwesome5 name="wikipedia-w" size={this.state.windowWidth / 20} color="#3D03A8" />
								<Text style={styles.finalDisplayButtonsText}>View on Wikipedia</Text>
							</TouchableOpacity>
							: null}
					</View>
					<AnimatedImage
						source={{ uri: this.state.trefleResponse.image_url }}
						style={styles.resultImage} />

					{ // Display for Novice
						this.state.complexity == "novice" ?
							<View style={styles.resultContainer}>
								{/* Container for General*/}
								<View style={styles.resultPartContainer}>
									<Text style={styles.resultPartContainerTitle}>{this.state.trefleResponse.common_name}</Text>
									{this.state.trefleResponse.year != null ?
										<Text style={styles.text}>Discovered {new Date().getYear() + 1900 - this.state.trefleResponse.year} years ago</Text>
										: null}
									{this.state.trefleResponse.edible != null && this.state.trefleResponse.edible ?
										<Text style={styles.text}>Safe to eat</Text>
										: this.state.trefleResponse.edible != null && this.state.trefleResponse.edible == false ?
											<Text style={styles.text}>Not safe to eat</Text>
											: null}
									{this.state.trefleResponse.edible_part != null ?
										<View style={{ flex: 1, flexDirection: 'row' }}>
											<Text>What parts are safe to eat?: </Text>
											{this.state.trefleResponse.edible_part.map(part => (
												<Text style={styles.text}> {part}</Text>
											))}
										</View> : null}
									{this.state.trefleResponse.duration != null ?
										<View style={{ flex: 1, flexDirection: 'row' }}>
											<Text>Lives for </Text>
											{this.state.trefleResponse.duration.map(part => (
												part == "annual" ?
													<Text style={styles.text}>1 season</Text>
													: part == "biennial" ? <Text style={styles.text}>2 seasons</Text>
														: part == "parennial" ? <Text style={styles.text}>more than 2 years</Text>
															: null
											))}
										</View>
										: null}
									{this.state.trefleResponse.vegetable != null && this.state.trefleResponse.vegetable == true ?
										<Text style={styles.text}>This plant is a vegetable!</Text>
										: null}
								</View>
								{/* Container for Flower Fruit and Leaf*/}
								{this.state.trefleResponse.images.flower != null || this.state.trefleResponse.images.fruit != null ?
									<View style={styles.resultPartContainer}>
										<Text style={styles.resultPartContainerTitle}>Flower, Fruit and Leaf</Text>
										{this.state.trefleResponse.images.flower != null ?
											<View style={{ alignItems: 'center' }}>
												<Text style={styles.text}>Flower</Text>
												<View style={styles.resultImageContainer}>
													{this.state.trefleResponse.images.flower.slice(0, 3).map(img => (
														<AnimatedImage key={img.id}
															source={{ uri: img.image_url }}
															style={styles.resultPartContainerImage} />
													))}
												</View></View> : null}
										{this.state.trefleResponse.flower.conspicuous != null && this.state.trefleResponse.flower.conspicuous == true ?
											<Text style={styles.text}>You can see the flower</Text>
											: this.state.trefleResponse.flower.conspicuous != null && this.state.trefleResponse.flower.conspicuous == false ?
												<Text style={styles.text}>You can't see the flower</Text>
												: null}

										{this.state.trefleResponse.images.fruit != null ?
											<View style={{ alignItems: 'center' }}>
												<Text style={styles.text}>Fruit</Text>
												<View style={styles.resultImageContainer}>
													{this.state.trefleResponse.images.fruit.slice(0, 3).map(img => (
														<AnimatedImage key={img.id}
															source={{ uri: img.image_url }}
															style={styles.resultPartContainerImage} />
													))}
												</View></View> : null}

										{this.state.trefleResponse.fruit_or_seed.conspicuous != null && this.state.trefleResponse.fruit_or_seed.conspicuous == true ?
											<Text style={styles.text}>You can see the fruit</Text>
											: this.state.trefleResponse.fruit_or_seed.conspicuous != null && this.state.trefleResponse.fruit_or_seed.conspicuous == false ?
												<Text style={styles.text}>You can't see the fruit</Text>
												: null}
										{this.state.trefleResponse.fruit_or_seed.seed_persistence != null && this.state.trefleResponse.fruit_or_seed.seed_persistence == true ?
											<Text style={styles.text}>Seed stays on the plant</Text>
											: this.state.trefleResponse.fruit_or_seed.seed_persistence != null && this.state.trefleResponse.fruit_or_seed.seed_persistence == false ?
												<Text style={styles.text}>Seed does not stay on the plant</Text>
												: null}

										{this.state.trefleResponse.images.leaf != null ?
											<View style={{ alignItems: 'center' }}>
												<Text style={styles.text}>Leaf</Text>
												<View style={styles.resultImageContainer}>
													{this.state.trefleResponse.images.leaf.slice(0, 3).map(img => (
														<AnimatedImage key={img.id}
															source={{ uri: img.image_url }}
															style={styles.resultPartContainerImage} />
													))}
												</View></View> : null}

										{this.state.trefleResponse.foliage.leaf_retention != null && this.state.trefleResponse.foliage.leaf_retention == true ?
											<Text style={styles.text}>Leaves stay all year long</Text>
											: this.state.trefleResponse.foliage.leaf_retention != null && this.state.trefleResponse.foliage.leaf_retention == false ?
												<Text style={styles.text}>Leaves fall off each year</Text>
												: null}

									</View>
									: null}

								{/* Container for Growth*/}
								{this.state.trefleResponse.specifications != null || this.state.trefleResponse.growth != null ?
									<View style={styles.resultPartContainer}>
										<Text style={styles.resultPartContainerTitle}>Growth</Text>
										{this.state.trefleResponse.images.habit != null ?
											<View style={{ alignItems: 'center' }}>
												<Text style={styles.text}>Where it usually grows</Text>
												<View style={styles.resultImageContainer}>
													{this.state.trefleResponse.images.habit.slice(0, 3).map(img => (
														<AnimatedImage key={img.id}
															source={{ uri: img.image_url }}
															style={styles.resultPartContainerImage} />
													))}
												</View></View> : null}

										{this.state.trefleResponse.specifications.growth_habit != null ?
											<Text style={styles.text}>Grows similar to any {this.state.trefleResponse.specifications.growth_habit}</Text>
											: null}
										{this.state.trefleResponse.specifications.growth_rate != null ?
											<Text style={styles.text}>Grows {this.state.trefleResponse.specifications.growth_rate}ly</Text>
											: null}
										{this.state.trefleResponse.specifications.maximum_height.cm != null ?
											<Text style={styles.text}>Tallest it can get: {this.state.trefleResponse.specifications.maximum_height.cm}cm</Text>
											: null}
										{this.state.trefleResponse.specifications.toxicity != null ?
											this.state.trefleResponse.specifications.toxicity == 'none' ?
												<Text style={styles.text}>It is completely safe to pick up and handle</Text>
												: <Text style={styles.text}>Do not pick up this plant! It can hurt you!</Text>
											: null}
										{this.state.trefleResponse.growth.days_to_harvest != null ?
											<Text style={styles.text}>Days to grow: {this.state.trefleResponse.growth.days_to_harvest}</Text>
											: null}
										{this.state.trefleResponse.growth.description != null ?
											<Text style={styles.text}>How does the plant grow?: {this.state.trefleResponse.growth.description}</Text>
											: null}
										{this.state.trefleResponse.growth.light != null ?
											this.state.trefleResponse.growth.light <= 3 ?
												<Text style={styles.text}>It grows in dark places</Text>
												: this.state.trefleResponse.growth.light > 3 && this.state.trefleResponse.growth.light <= 6 ?
													<Text style={styles.text}>It grows in places with light</Text>
													: this.state.trefleResponse.growth.light < 6 ?
														<Text style={styles.text}>It grows in very bright places under sunlight</Text>
														: null
											: null}
										{this.state.trefleResponse.growth.growth_months != null ?
											<View style={{ flex: 1, flexDirection: 'row' }}>
												<Text>The only months it grows in: </Text>
												{this.state.trefleResponse.growth.growth_month.map(month => (
													<Text style={styles.text}> {month}</Text>
												))}
											</View>
											: null}
										{this.state.trefleResponse.growth.bloom_months != null ?
											<View style={{ flex: 1, flexDirection: 'row' }}>
												<Text>The only months it blooms in: </Text>
												{this.state.trefleResponse.growth.bloom_months.map(month => (
													<Text style={styles.text}> {month}</Text>
												))}
											</View>
											: null}
										{this.state.trefleResponse.growth.fruit_months != null ?
											<View style={{ flex: 1, flexDirection: 'row' }}>
												<Text>The only months it grows fruit in: </Text>
												{this.state.trefleResponse.growth.fruit_months.map(month => (
													<Text style={styles.text}> {month}</Text>
												))}
											</View>
											: null}
										{this.state.trefleResponse.growth.soil_humidity != null ?
											this.state.trefleResponse.growth.soil_humidity <= 3 ?
												<Text style={styles.text}>It grows in dry places like the desert</Text>
												: this.state.trefleResponse.growth.soil_humidity > 3 && this.state.trefleResponse.growth.soil_humidity <= 6 ?
													<Text style={styles.text}>It grows in green and grassy places</Text>
													: this.state.trefleResponse.growth.soil_humidity < 6 ?
														<Text style={styles.text}>It grows in very wet places like the beach or underwater</Text>
														: null
											: null}

									</View>
									: null}
							</View>
							// Display for Intermediate
							: this.state.complexity == "intermediate" ?
								<View style={styles.resultContainer}>
									{/* Container for General*/}
									<View style={styles.resultPartContainer}>
										<Text style={styles.resultPartContainerTitle}>{this.state.trefleResponse.common_name}</Text>
										{this.state.trefleResponse.family_common_name != null ?
											<Text style={styles.text}>Belongs to {this.state.trefleResponse.family_common_name}</Text>
											: null}
										{this.state.trefleResponse.year != null ?
											<Text style={styles.text}>Discovered in year {this.state.trefleResponse.year}</Text>
											: null}
										{this.state.trefleResponse.edible != null && this.state.trefleResponse.edible ?
											<Text style={styles.text}>Safe to eat</Text>
											: this.state.trefleResponse.edible != null && this.state.trefleResponse.edible == false ?
												<Text style={styles.text}>Not safe to eat</Text>
												: null}
										{this.state.trefleResponse.edible_part != null ?
											<View style={{ flex: 1, flexDirection: 'row' }}>
												<Text>Contains edible parts: </Text>
												{this.state.trefleResponse.edible_part.map(part => (
													<Text style={styles.text}> {part}</Text>
												))}
											</View> : null}
										{this.state.trefleResponse.duration != null ?
											<View style={{ flex: 1, flexDirection: 'row' }}>
												<Text>Plants duration: </Text>
												{this.state.trefleResponse.duration.map(part => (
													part == "annual" ?
														<Text style={styles.text}>Annual: lives, reproduces, and dies in one growing season</Text>
														: part == "biennial" ? <Text style={styles.text}>Biennial: needs two growing seasons to complete its life cycle, normally completing vegetative growth the first year and flowering the second year</Text>
															: part == "parennial" ? <Text style={styles.text}>Perennial: lives for more than two years, with the shoot system dying back to soil level each year.</Text>
																: null
												))}
											</View>
											: null}
										{this.state.trefleResponse.vegetable != null && this.state.trefleResponse.vegetable == true ?
											<Text style={styles.text}>Is considered to be a vegetable</Text>
											: null}
									</View>
									{/* Container for Flower Fruit and Leaf*/}
									{this.state.trefleResponse.images.flower != null || this.state.trefleResponse.images.fruit != null ?
										<View style={styles.resultPartContainer}>
											<Text style={styles.resultPartContainerTitle}>Flower, Fruit and Leaf</Text>
											{this.state.trefleResponse.images.flower != null ?
												<View style={{ alignItems: 'center' }}>
													<Text style={styles.text}>Flower</Text>
													<View style={styles.resultImageContainer}>
														{this.state.trefleResponse.images.flower.slice(0, 3).map(img => (
															<AnimatedImage key={img.id}
																source={{ uri: img.image_url }}
																style={styles.resultPartContainerImage} />
														))}
													</View></View> : null}
											{this.state.trefleResponse.flower.conspicuous != null && this.state.trefleResponse.flower.conspicuous == true ?
												<Text style={styles.text}>Flower is visible</Text>
												: this.state.trefleResponse.flower.conspicuous != null && this.state.trefleResponse.flower.conspicuous == false ?
													<Text style={styles.text}>Flower is hidden</Text>
													: null}

											{this.state.trefleResponse.images.fruit != null ?
												<View style={{ alignItems: 'center' }}>
													<Text style={styles.text}>Fruit</Text>
													<View style={styles.resultImageContainer}>
														{this.state.trefleResponse.images.fruit.slice(0, 3).map(img => (
															<AnimatedImage key={img.id}
																source={{ uri: img.image_url }}
																style={styles.resultPartContainerImage} />
														))}
													</View></View> : null}

											{this.state.trefleResponse.fruit_or_seed.conspicuous != null && this.state.trefleResponse.fruit_or_seed.conspicuous == true ?
												<Text style={styles.text}>Fruit is visible</Text>
												: this.state.trefleResponse.fruit_or_seed.conspicuous != null && this.state.trefleResponse.fruit_or_seed.conspicuous == false ?
													<Text style={styles.text}>Fruit is hidden</Text>
													: null}
											{this.state.trefleResponse.fruit_or_seed.seed_persistence != null && this.state.trefleResponse.fruit_or_seed.seed_persistence == true ?
												<Text style={styles.text}>Seed is generally recognised as being persistent on the plant</Text>
												: this.state.trefleResponse.fruit_or_seed.seed_persistence != null && this.state.trefleResponse.fruit_or_seed.seed_persistence == false ?
													<Text style={styles.text}>Seed is generally recognised as not being persistent on the plant</Text>
													: null}

											{this.state.trefleResponse.images.leaf != null ?
												<View style={{ alignItems: 'center' }}>
													<Text style={styles.text}>Leaf</Text>
													<View style={styles.resultImageContainer}>
														{this.state.trefleResponse.images.leaf.slice(0, 3).map(img => (
															<AnimatedImage key={img.id}
																source={{ uri: img.image_url }}
																style={styles.resultPartContainerImage} />
														))}
													</View></View> : null}

											{this.state.trefleResponse.foliage.leaf_retention != null && this.state.trefleResponse.foliage.leaf_retention == true ?
												<Text style={styles.text}>Leaves stay all year long</Text>
												: this.state.trefleResponse.foliage.leaf_retention != null && this.state.trefleResponse.foliage.leaf_retention == false ?
													<Text style={styles.text}>Leaves do not stay all year long</Text>
													: null}

										</View>
										: null}

									{/* Container for Growth*/}
									{this.state.trefleResponse.specifications != null || this.state.trefleResponse.growth != null ?
										<View style={styles.resultPartContainer}>
											<Text style={styles.resultPartContainerTitle}>Growth</Text>
											{this.state.trefleResponse.images.habit != null ?
												<View style={{ alignItems: 'center' }}>
													<Text style={styles.text}>Habitat</Text>
													<View style={styles.resultImageContainer}>
														{this.state.trefleResponse.images.habit.slice(0, 3).map(img => (
															<AnimatedImage key={img.id}
																source={{ uri: img.image_url }}
																style={styles.resultPartContainerImage} />
														))}
													</View></View> : null}

											{this.state.trefleResponse.specifications.growth_habit != null ?
												<Text style={styles.text}>Grows similar to:  {this.state.trefleResponse.specifications.growth_habit}</Text>
												: null}
											{this.state.trefleResponse.specifications.growth_rate != null ?
												<Text style={styles.text}>Growth speed: {this.state.trefleResponse.specifications.growth_rate}</Text>
												: null}
											{this.state.trefleResponse.specifications.maximum_height.cm != null ?
												<Text style={styles.text}>Maximum height: {this.state.trefleResponse.specifications.maximum_height.cm}cm</Text>
												: null}
											{this.state.trefleResponse.specifications.toxicity != null ?
												<Text style={styles.text}>Toxicity towards humans and animals: {this.state.trefleResponse.specifications.toxicity}</Text>
												: null}
											{this.state.trefleResponse.growth.days_to_harvest != null ?
												<Text style={styles.text}>Days to harvest from planting: {this.state.trefleResponse.growth.days_to_harvest}</Text>
												: null}
											{this.state.trefleResponse.growth.description != null ?
												<Text style={styles.text}>How does the plant grow?: {this.state.trefleResponse.growth.description}</Text>
												: null}
											{this.state.trefleResponse.growth.ph_maximum != null && this.state.trefleResponse.growth.ph_minimum ?
												<Text style={styles.text}>Acceptable soil pH range: {this.state.trefleResponse.growth.ph_minimum} - {this.state.trefleResponse.growth.ph_maximum}  (0: extremely acidic, 7: neutral, 14: extremely basic)</Text>
												: null}
											{this.state.trefleResponse.growth.light != null ?
												<Text style={styles.text}>Required amount of light: {this.state.trefleResponse.growth.light * 10000} LUX (0: pitch black, 10,000 full daylight, 100,000 intensive insolation)</Text>
												: null}
											{this.state.trefleResponse.growth.atmospheric_humidity != null ?
												<Text style={styles.text}>Required relative humidity in the air: {this.state.trefleResponse.growth.atmospheric_humidity * 10}% (% of the maximum amount of water vapor the air can hold at the same temperature)</Text>
												: null}
											{this.state.trefleResponse.growth.growth_months != null ?
												<View style={{ flex: 1, flexDirection: 'row' }}>
													<Text>Actively grows in: </Text>
													{this.state.trefleResponse.growth.growth_month.map(month => (
														<Text style={styles.text}> {month}</Text>
													))}
												</View>
												: null}
											{this.state.trefleResponse.growth.bloom_months != null ?
												<View style={{ flex: 1, flexDirection: 'row' }}>
													<Text>Usually blooms in: </Text>
													{this.state.trefleResponse.growth.bloom_months.map(month => (
														<Text style={styles.text}> {month}</Text>
													))}
												</View>
												: null}
											{this.state.trefleResponse.growth.fruit_months != null ?
												<View style={{ flex: 1, flexDirection: 'row' }}>
													<Text>Usually produces fruit in: </Text>
													{this.state.trefleResponse.growth.fruit_months.map(month => (
														<Text style={styles.text}> {month}</Text>
													))}
												</View>
												: null}
											{this.state.trefleResponse.growth.minimum_temperature.deg_c != null && this.state.trefleResponse.growth.maximum_temperature.deg_c ?
												<Text style={styles.text}>Acceptable temperature range: {this.state.trefleResponse.growth.minimum_temperature.deg_c} - {this.state.trefleResponse.growth.maximumtemperature.deg_c} degrees celcius</Text>
												: null}
											{this.state.trefleResponse.growth.soil_humidity != null ?
												<Text style={styles.text}>Required soil humidity: {this.state.trefleResponse.growth.soil_humidity} (0: desert, 10: underwater)</Text>
												: null}

										</View>
										: null}
								</View>
								// Display for Advanced
								: this.state.complexity == "advanced" ?
									<View style={styles.resultContainer}>
										{/* Container for General*/}
										<View style={styles.resultPartContainer}>
											<Text style={styles.resultPartContainerTitle}>{this.state.trefleResponse.scientific_name}</Text>
											<Text style={styles.text}>Commonly known as {this.state.trefleResponse.common_name}</Text>
											{this.state.plantidResponse != null ?
												<Text style={styles.text}>{this.state.suggestion.plant_details.wiki_description.value}</Text>
												: null}
											{this.state.trefleResponse.family_common_name != null && this.state.trefleResponse.family ?
												<Text style={styles.text}>Belongs to {this.state.trefleResponse.family_common_name} - {this.state.trefleResponse.family}</Text>
												: null}
											{this.state.trefleResponse.year != null ?
												<Text style={styles.text}>Named in year {this.state.trefleResponse.year}</Text>
												: null}
											{this.state.trefleResponse.edible != null && this.state.trefleResponse.edible ?
												<Text style={styles.text}>Safe to eat</Text>
												: this.state.trefleResponse.edible != null && this.state.trefleResponse.edible == false ?
													<Text style={styles.text}>Not safe to eat</Text>
													: null}
											{this.state.trefleResponse.edible_part != null ?
												<View style={{ flex: 1, flexDirection: 'row' }}>
													<Text>Contains edible parts: </Text>
													{this.state.trefleResponse.edible_part.map(part => (
														<Text style={styles.text}> {part}</Text>
													))}
												</View> : null}
											{this.state.trefleResponse.duration != null ?
												<View style={{ flex: 1, flexDirection: 'row' }}>
													<Text>Plants duration: </Text>
													{this.state.trefleResponse.duration.map(part => (
														<Text style={styles.text}> {part}</Text>
													))}
												</View>
												: null}
											{this.state.trefleResponse.vegetable != null && this.state.trefleResponse.vegetable == true ?
												<Text style={styles.text}>Contains the requirements to be and is classified as a Vegetable</Text>
												: null}
										</View>
										{/* Container for Flower Fruit and Leaf*/}
										{this.state.trefleResponse.images.flower != null || this.state.trefleResponse.images.fruit != null ?
											<View style={styles.resultPartContainer}>
												<Text style={styles.resultPartContainerTitle}>Flower, Fruit and Leaf</Text>
												{this.state.trefleResponse.images.flower != null ?
													<View style={{ alignItems: 'center' }}>
														<Text style={styles.text}>Flower</Text>
														<View style={styles.resultImageContainer}>
															{this.state.trefleResponse.images.flower.slice(0, 3).map(img => (
																<AnimatedImage key={img.id}
																	source={{ uri: img.image_url }}
																	style={styles.resultPartContainerImage} />
															))}
														</View></View> : null}
												{this.state.trefleResponse.flower.conspicuous != null && this.state.trefleResponse.flower.conspicuous == true ?
													<Text style={styles.text}>Flower is visible</Text>
													: this.state.trefleResponse.flower.conspicuous != null && this.state.trefleResponse.flower.conspicuous == false ?
														<Text style={styles.text}>Flower is hidden</Text>
														: null}

												{this.state.trefleResponse.images.fruit != null ?
													<View style={{ alignItems: 'center' }}>
														<Text style={styles.text}>Fruit</Text>
														<View style={styles.resultImageContainer}>
															{this.state.trefleResponse.images.fruit.slice(0, 3).map(img => (
																<AnimatedImage key={img.id}
																	source={{ uri: img.image_url }}
																	style={styles.resultPartContainerImage} />
															))}
														</View></View> : null}

												{this.state.trefleResponse.fruit_or_seed.conspicuous != null && this.state.trefleResponse.fruit_or_seed.conspicuous == true ?
													<Text style={styles.text}>Fruit is visible</Text>
													: this.state.trefleResponse.fruit_or_seed.conspicuous != null && this.state.trefleResponse.fruit_or_seed.conspicuous == false ?
														<Text style={styles.text}>Fruit is hidden</Text>
														: null}
												{this.state.trefleResponse.fruit_or_seed.seed_persistence != null && this.state.trefleResponse.fruit_or_seed.seed_persistence == true ?
													<Text style={styles.text}>Seed is generally recognised as being persistent on the plant</Text>
													: this.state.trefleResponse.fruit_or_seed.seed_persistence != null && this.state.trefleResponse.fruit_or_seed.seed_persistence == false ?
														<Text style={styles.text}>Seed is generally recognised as not being persistent on the plant</Text>
														: null}

												{this.state.trefleResponse.images.leaf != null ?
													<View style={{ alignItems: 'center' }}>
														<Text style={styles.text}>Leaf</Text>
														<View style={styles.resultImageContainer}>
															{this.state.trefleResponse.images.leaf.slice(0, 3).map(img => (
																<AnimatedImage key={img.id}
																	source={{ uri: img.image_url }}
																	style={styles.resultPartContainerImage} />
															))}
														</View></View> : null}

												{this.state.trefleResponse.foliage.leaf_retention != null && this.state.trefleResponse.foliage.leaf_retention == true ?
													<Text style={styles.text}>Leaves stay all year long</Text>
													: this.state.trefleResponse.foliage.leaf_retention != null && this.state.trefleResponse.foliage.leaf_retention == false ?
														<Text style={styles.text}>Leaves do not stay all year long</Text>
														: null}

											</View>
											: null}

										{/* Container for Growth*/}
										{this.state.trefleResponse.specifications != null || this.state.trefleResponse.growth != null ?
											<View style={styles.resultPartContainer}>
												<Text style={styles.resultPartContainerTitle}>Growth</Text>
												{this.state.trefleResponse.images.habit != null ?
													<View style={{ alignItems: 'center' }}>
														<Text style={styles.text}>Habitat</Text>
														<View style={styles.resultImageContainer}>
															{this.state.trefleResponse.images.habit.slice(0, 3).map(img => (
																<AnimatedImage key={img.id}
																	source={{ uri: img.image_url }}
																	style={styles.resultPartContainerImage} />
															))}
														</View></View> : null}

												{this.state.trefleResponse.specifications.growth_habit != null ?
													<Text style={styles.text}>The general appearance, growth form, or architecture of the plant: {this.state.trefleResponse.specifications.growth_habit}</Text>
													: null}
												{this.state.trefleResponse.specifications.growth_rate != null ?
													<Text style={styles.text}>The relative growth speed of the plant: {this.state.trefleResponse.specifications.growth_rate}</Text>
													: null}
												{this.state.trefleResponse.specifications.maximum_height.cm != null ?
													<Text style={styles.text}>Maximum height: {this.state.trefleResponse.specifications.maximum_height.cm}cm</Text>
													: null}
												{this.state.trefleResponse.specifications.toxicity != null ?
													<Text style={styles.text}>Relative toxicity of the species for humans or animals: {this.state.trefleResponse.specifications.toxicity}</Text>
													: null}
												{this.state.trefleResponse.growth.days_to_harvest != null ?
													<Text style={styles.text}>The average numbers of days required to from planting to harvest: {this.state.trefleResponse.growth.days_to_harvest}</Text>
													: null}
												{this.state.trefleResponse.growth.description != null ?
													<Text style={styles.text}>How does the plant grow?: {this.state.trefleResponse.growth.description}</Text>
													: null}
												{this.state.trefleResponse.growth.ph_maximum != null && this.state.trefleResponse.growth.ph_minimum ?
													<Text style={styles.text}>Acceptable soil pH range: {this.state.trefleResponse.growth.ph_minimum} - {this.state.trefleResponse.growth.ph_maximum}</Text>
													: null}
												{this.state.trefleResponse.growth.light != null ?
													<Text style={styles.text}>Required amount of light: {this.state.trefleResponse.growth.light * 10000} LUX</Text>
													: null}
												{this.state.trefleResponse.growth.atmospheric_humidity != null ?
													<Text style={styles.text}>Required relative humidity in the air: {this.state.trefleResponse.growth.atmospheric_humidity * 10}%</Text>
													: null}
												{this.state.trefleResponse.growth.growth_months != null ?
													<View style={{ flex: 1, flexDirection: 'row' }}>
														<Text>Actively grows in: </Text>
														{this.state.trefleResponse.growth.growth_month.map(month => (
															<Text style={styles.text}> {month}</Text>
														))}
													</View>
													: null}
												{this.state.trefleResponse.growth.bloom_months != null ?
													<View style={{ flex: 1, flexDirection: 'row' }}>
														<Text>Usually blooms in: </Text>
														{this.state.trefleResponse.growth.bloom_months.map(month => (
															<Text style={styles.text}> {month}</Text>
														))}
													</View>
													: null}
												{this.state.trefleResponse.growth.fruit_months != null ?
													<View style={{ flex: 1, flexDirection: 'row' }}>
														<Text>Usually produces fruit in: </Text>
														{this.state.trefleResponse.growth.fruit_months.map(month => (
															<Text style={styles.text}> {month}</Text>
														))}
													</View>
													: null}
												{this.state.trefleResponse.growth.minimum_temperature.deg_c != null && this.state.trefleResponse.growth.maximum_temperature.deg_c ?
													<Text style={styles.text}>Acceptable temperature range: {this.state.trefleResponse.growth.minimum_temperature.deg_c} - {this.state.trefleResponse.growth.maximumtemperature.deg_c} degrees celcius</Text>
													: null}
												{this.state.trefleResponse.growth.soil_humidity != null ?
													<Text style={styles.text}>Required soil humidity 0 (xerophile) to 10 (subaquatic): {this.state.trefleResponse.growth.soil_humidity}</Text>
													: null}

											</View>
											: null}
									</View>
									: null}
				</View>
			);
		}
	}
	//----------------------------------------------------------------------------------------------------------------//
	//----------------------------------------------------------------------------------------------------------------//
	//-----------------------------------------------------[Functions]------------------------------------------------//
	//----------------------------------------------------------------------------------------------------------------//
	//----------------------------------------------------------------------------------------------------------------//


	//----------------------------[Function] returns a view for user level and xp----------------------------//
	displayUserLevel = () => {
		return (
			<View style={styles.userLevelView}>
				{this.state.levelup ? <Text style={styles.text}>Level up!</Text> : null}
				<Text style={styles.text}>Level {this.state.userlevel.level}</Text>
				<Progress.Bar animationType={'timing'} height={20} progress={this.state.userlevel.xp / 100} width={this.state.windowWidth / 2} color={'#3D03A8'} />
			</View>
		)
	}
	//----------------------------[Function] handles user level and xp changes----------------------------//
	gainXp = (xp) => {
		let userlevel = this.state.userlevel;
		userlevel.xp = userlevel.xp + xp;
		while (userlevel.xp >= 100) {
			userlevel.level = userlevel.level + 1;
			userlevel.xp = userlevel.xp - 100;
		}
		this.setState({ userlevel: userlevel })
		this.storeUserlevel(userlevel);
	}

	//----------------------------[Function] Check wether the submitted plant is part of the challenge----------------------------//
	challengeCheck = (toCheck) => {
		console.log("Checking challenge");
		switch (this.state.complexity) {
			// Check Advanced Challenge
			case 'advanced':
				if (this.state.advancedChallenge != null) {
					let challengeState = this.state.advancedChallenge;
					let challengeSoFarState = this.state.advancedChallengeSoFar;
					if (challengeSoFarState == null) {
						challengeSoFarState = [null, null, null, null]
					}
					let completedChallenge = null;
					for (let i = 0; i < challengeState.length; i++) {
						if (toCheck.genus_id == challengeState[i].genus_id) {
							completedChallenge = challengeState[i];
							completedChallenge.discovered = true;
							completedChallenge.userimage = this.state.imageBase64;
							challengeSoFarState[i] = completedChallenge;
							if (i == 3) {
								this.setState({ challengeComplete: true })
							}

						}
					}
					if (completedChallenge != null) {
						this.setState({ advancedChallengeSoFar: challengeSoFarState });
						this.storeChallengeProgress(this.state.advancedChallengeSoFar);
						this.setState({ challengeCompleteModalDisplay: true });

						// Update user level
						this.gainXp(20);
					} else {
						console.log("Not Part of a challenge")
					}
				}
				break;
			// Check Intermediate Challenge
			case 'intermediate':
				if (this.state.intermediateChallange != null) {
					let challengeSoFarState = this.state.intermediateChallangeSoFar;
					if (challengeSoFarState == null) {
						challengeSoFarState = [null, null, null, null]
					}
					let completedChallenge = null;
					switch (this.state.intermediateChallange[0]) {
						case "duration":
							for (let i = 0; i < toCheck.duration; i++) {
								if (toCheck.duration[i] == this.state.intermediateChallange[1]) {
									completedChallenge = toCheck;
								}
							}
							break;
						case "flower.color":
							if (toCheck.flower.color != null) {
								for (let i = 0; i < toCheck.flower.color.length; i++) {
									if (toCheck.flower.color[i] == this.state.intermediateChallange[1]) {
										completedChallenge = toCheck;
										break;
									}
								}
							}
							break;
						case "growth.soil_humidity":
							let low = parseInt(this.state.intermediateChallange[1].split('-')[0]);
							let high = parseInt(this.state.intermediateChallange[1].split('-')[1]);
							if (toCheck.growth.soil_humidity <= high && toCheck.growth.soil_humidity >= low) {
								completedChallenge = toCheck;
							}
							break;
						case "fruit_or_seed.color":
							if (toCheck.fruit_or_seed.color != null) {
								for (let i = 0; i < toCheck.fruit_or_seed.color.length; i++) {
									if (toCheck.fruit_or_seed.color[i] == this.state.intermediateChallange[1]) {
										completedChallenge = toCheck;
										break;
									}
								}
							}
							break;
						default:
							break;
					}
					if (completedChallenge != null) {
						for (let i = 0; i < challengeSoFarState.length; i++) {
							if (completedChallenge.common_name == challengeSoFarState[i].common_name) {
								console.log("Plant already used for current challenge: [" + this.state.intermediateChallange[0] + " : " + this.state.intermediateChallange[1] + " ]")
								break;
							}
							if (challengeSoFarState[i] == null) {
								challengeSoFarState[i] = completedChallenge;
								challengeSoFarState[i].discovered = true;
								challengeSoFarState[i].userimage = this.state.imageBase64;
								if (i == 3) {
									this.setState({ challengeComplete: true })
								}
								break;
							}
						}
						this.setState({ intermediateChallangeSoFar: challengeSoFarState });
						this.storeChallengeProgress(this.state.intermediateChallangeSoFar);
						this.setState({ challengeCompleteModalDisplay: true });

						// Update user level
						this.gainXp(20);
					} else {
						console.log("Not Part of a challenge");
					}
				}
				break;
			// Check Novice Challenge
			case 'novice':
				if (this.state.noviceChallenge != null) {
					let challengeSoFarState = this.state.noviceChallengeSoFar;
					if (challengeSoFarState == null) {
						challengeSoFarState = [null, null, null, null]
					}
					let completedChallenge = null;
					switch (this.state.noviceChallenge[0]) {
						case "edible":
							if (toCheck.edible == this.state.noviceChallenge[1]) {
								completedChallenge = toCheck;
							}
							break;
						case "flower.color":
							if (toCheck.flower.color != null) {
								for (let i = 0; i < toCheck.flower.color.length; i++) {
									if (toCheck.flower.color[i] == this.state.noviceChallenge[1]) {
										completedChallenge = toCheck;
										break;
									}
								}
							}
							break;
						case "vegetable":
							if (toCheck.vegetable == this.state.noviceChallenge[1]) {
								completedChallenge = toCheck;
							}
							break;
						case "fruit_or_seed.color":
							if (toCheck.fruit_or_seed.color != null) {
								for (let i = 0; i < toCheck.fruit_or_seed.color.length; i++) {
									if (toCheck.fruit_or_seed.color[i] == this.state.noviceChallenge[1]) {
										completedChallenge = toCheck;
										break;
									}
								}
							}
							break;
						default:
							break;
					}
					// Handle if challenge part is complete
					if (completedChallenge != null) {
						for (let i = 0; i < challengeSoFarState.length; i++) {
							if (challengeSoFarState[i] != null && completedChallenge.common_name == challengeSoFarState[i].common_name) {
								console.log("Plant already used for current challenge: [" + this.state.noviceChallenge[0] + " : " + this.state.noviceChallenge[1] + " ]")
								break;
							}
							if (challengeSoFarState[i] == null) {
								challengeSoFarState[i] = completedChallenge;
								challengeSoFarState[i].discovered = true;
								challengeSoFarState[i].userimage = this.state.imageBase64;
								if (i == 3) {
									this.setState({ challengeComplete: true })
								}
								break;
							}
						}
						this.setState({ noviceChallengeSoFar: challengeSoFarState });
						this.storeChallengeProgress(this.state.noviceChallengeSoFar);
						this.setState({ challengeCompleteModalDisplay: true });

						// Update user level
						this.gainXp(20);
					} else {
						console.log("Not Part of a challenge");
					}
				}
				break;
			default:
				break;
		}
	}


	//----------------------------[Function] Store complexity----------------------------//
	storeComplexity = async selection => {
		try {
			await AsyncStorage.setItem('complexity', selection);
		} catch (error) {
			console.log(error, " [Error storing complexity data]");
		}
	}

	//----------------------------[Function] Store User Level and XP----------------------------//
	storeUserlevel = async selection => {
		try {
			await AsyncStorage.setItem('userlevel', JSON.stringify(selection));
		} catch (error) {
			console.log(error, " [Error storing userlevel data]");
		}
	}

	//----------------------------[Function] Get last challenge ID----------------------------//
	retrieveLastChallengeID = async () => {
		try {
			const id = await AsyncStorage.getItem('challengeid');
			if (id != null) {
				this.setState({ "lastchallengeid": parseInt(id) })
			} else {
				this.setState({ "lastchallengeid": 1 })
				this.storeLastChallengeID();
			}
		} catch (error) {
			console.log(error, " [Error getting last challenge id]");
		}
	}

	//----------------------------[Function] Store last challenge ID----------------------------//
	storeLastChallengeID = async () => {
		try {
			await AsyncStorage.setItem('challengeid', this.state.lastchallengeid.toString());
		} catch (error) {
			console.log(error, " [Error saving last challenge id]");
		}
	}

	//----------------------------[Function] Store challenge----------------------------//
	storeChallenge = async (challenge) => {
		try {
			let existingdata = JSON.parse(await FileSystem.readAsStringAsync(FileSystem.documentDirectory + 'userdata/challenges/systemchallenges.json'));
			if (this.state.complexity == 'advanced') {
				existingdata.advanced = challenge;
			}
			if (this.state.complexity == 'intermediate') {
				existingdata.intermediate = challenge;
			}
			if (this.state.complexity == 'novice') {
				existingdata.novice = challenge;
			}
			await FileSystem.writeAsStringAsync(FileSystem.documentDirectory + 'userdata/challenges/systemchallenges.json', JSON.stringify(existingdata));
			console.log("Challenge Stored");
		} catch (error) {
			console.log(error, " [Error storing challenge data]");
		}
	}
	//----------------------------[Function] Store challenge progress----------------------------//
	storeChallengeProgress = async (challenge) => {
		try {
			let existingchallenges = JSON.parse(await FileSystem.readAsStringAsync(FileSystem.documentDirectory + 'userdata/challenges/userchallenges.json'));
			if (this.state.complexity == 'advanced') {
				existingchallenges.advanced = challenge;
			}
			if (this.state.complexity == 'intermediate') {
				existingchallenges.intermediate = challenge;
			}
			if (this.state.complexity == 'novice') {
				existingchallenges.novice = challenge;
			}
			await FileSystem.writeAsStringAsync(FileSystem.documentDirectory + 'userdata/challenges/userchallenges.json', JSON.stringify(existingchallenges));
			console.log("Challenge Progress Saved");
		} catch (error) {
			console.log(error, " [Error storing challenge progress data]");
		}
	}

	//----------------------------[Function] Create FileSystem folders and files----------------------------//
	_maybeCreateFileSystem = async () => {
		try {
			let folderInfo = await FileSystem.getInfoAsync(FileSystem.documentDirectory + 'userdata/');
			let initialiseIdentificationsFile = [];
			let initialiseChallengesFile = { 'advanced': {}, 'intermediate': {}, 'novice': {} };
			if (!folderInfo.exists) {
				await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'userdata');
				await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'userdata/identifications');
				await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'userdata/challenges');
				await FileSystem.writeAsStringAsync(FileSystem.documentDirectory + 'userdata/identifications/useridentifications.json', JSON.stringify(initialiseIdentificationsFile));
				await FileSystem.writeAsStringAsync(FileSystem.documentDirectory + 'userdata/challenges/userchallenges.json', JSON.stringify(initialiseChallengesFile));
				await FileSystem.writeAsStringAsync(FileSystem.documentDirectory + 'userdata/challenges/systemchallenges.json', JSON.stringify(initialiseChallengesFile));
				console.log("New storage created");
			}
		} catch (error) {
			console.log(error + " [Failed Creating FileSystem]")
		}
	}
	//----------------------------[Function] Store identification and user photo----------------------------//
	storeIdentification = async () => {
		try {
			let toStore = this.state.trefleResponse;
			toStore.userimage = this.state.imageBase64;
			toStore.location = { latitude: this.state.latitude, longitude: this.state.longitude };

			let useridentifications = await FileSystem.readAsStringAsync(FileSystem.documentDirectory + 'userdata/identifications/useridentifications.json');
			const existinguseridentifications = JSON.parse(useridentifications);
			toStore.useridentificationid = existinguseridentifications.length;
			existinguseridentifications.push(toStore);
			await FileSystem.writeAsStringAsync(FileSystem.documentDirectory + 'userdata/identifications/useridentifications.json', JSON.stringify(existinguseridentifications));
			console.log("Identification added onto existing storage");

		} catch (error) {
			console.log(error, " Error storing data");
		}
	}

	//----------------------------[Function] Delete user data----------------------------//
	deleteUserData = async () => {
		try {
			await FileSystem.deleteAsync(FileSystem.documentDirectory + 'userdata/');
		} catch (error) {
			console.log(error + " [Error Deleting Data]");
		}

	}

	//----------------------------[Function] Retrieve Data----------------------------//
	retrieveData = async () => {
		try {
			// User Complexity selection
			const complexity = await AsyncStorage.getItem('complexity');
			if (complexity != null) {
				this.setState({ complexity: complexity })
			}

			// User Level
			const userlevel = await AsyncStorage.getItem('userlevel');
			if (userlevel != null) {
				this.setState({ userlevel: JSON.parse(userlevel) })
			} else {
				this.setState({ userlevel: { level: 0, xp: 0 } })
			}

			let data = null;
			// Existing system generated challenges

			data = JSON.parse(await FileSystem.readAsStringAsync(FileSystem.documentDirectory + 'userdata/challenges/systemchallenges.json'));
			if (JSON.stringify(data.advanced) != '{}') {
				this.setState({ advancedChallenge: data.advanced });
			}
			if (JSON.stringify(data.intermediate) != '{}') {
				this.setState({ intermediateChallange: data.intermediate });
			}
			if (JSON.stringify(data.novice) != '{}') {
				this.setState({ noviceChallenge: data.novice });
			}

			// Existing user challenge progress
			data = JSON.parse(await FileSystem.readAsStringAsync(FileSystem.documentDirectory + 'userdata/challenges/userchallenges.json'));
			if (JSON.stringify(data.advanced) != '{}') {
				this.setState({ advancedChallengeSoFar: data.advanced });
			}
			if (JSON.stringify(data.intermediate) != '{}') {
				this.setState({ intermediateChallangeSoFar: data.intermediate });
			}
			if (JSON.stringify(data.novice) != '{}') {
				this.setState({ noviceChallengeSoFar: data.novice });
			}
			// Latest challenge id used when challenges are generated
			this.retrieveLastChallengeID();
			console.log("Complexity and Challenge save retrieved");

		} catch (error) {
			console.log(error, " Error retrieving data")
		}
	}

	//----------------------------[Function] Retrieve User Identifications Data----------------------------//
	retrieveUserIdentificationsData = async () => {
		try {
			const useridentifications = await FileSystem.readAsStringAsync(FileSystem.documentDirectory + 'userdata/identifications/useridentifications.json');
			if (useridentifications !== null) {
				this.setState({ useridentifications: JSON.parse(useridentifications) });
			}
		} catch (error) {
			console.log(error, " Error retrieving data")
		}
	}

	//----------------------------[Function] Stars by prediction probability----------------------------//
	generateStars = probability => {
		if (probability > 0.80) {
			return (
				<View style={styles.stars}>
					<MaterialIcons name="star" size={this.state.windowWidth / 10} color="#3D03A8" />
					<MaterialIcons name="star" size={this.state.windowWidth / 10} color="#3D03A8" />
					<MaterialIcons name="star" size={this.state.windowWidth / 10} color="#3D03A8" />
					<MaterialIcons name="star" size={this.state.windowWidth / 10} color="#3D03A8" />
					<MaterialIcons name="star" size={this.state.windowWidth / 10} color="#3D03A8" />
				</View>
			)
		} else if (probability <= 0.80 && probability > 0.60) {
			return (
				<View style={styles.stars}>
					<MaterialIcons name="star" size={this.state.windowWidth / 10} color="#3D03A8" />
					<MaterialIcons name="star" size={this.state.windowWidth / 10} color="#3D03A8" />
					<MaterialIcons name="star" size={this.state.windowWidth / 10} color="#3D03A8" />
					<MaterialIcons name="star" size={this.state.windowWidth / 10} color="#3D03A8" />
					<MaterialIcons name="star" size={this.state.windowWidth / 10} color="grey" />
				</View>
			)
		} else if (probability <= 0.60 && probability > 0.40) {
			return (
				<View style={styles.stars}>
					<MaterialIcons name="star" size={this.state.windowWidth / 10} color="#3D03A8" />
					<MaterialIcons name="star" size={this.state.windowWidth / 10} color="#3D03A8" />
					<MaterialIcons name="star" size={this.state.windowWidth / 10} color="#3D03A8" />
					<MaterialIcons name="star" size={this.state.windowWidth / 10} color="grey" />
					<MaterialIcons name="star" size={this.state.windowWidth / 10} color="grey" />
				</View>
			)
		} else if (probability <= 0.40 && probability > 0.20) {
			return (
				<View style={styles.stars}>
					<MaterialIcons name="star" size={this.state.windowWidth / 10} color="#3D03A8" />
					<MaterialIcons name="star" size={this.state.windowWidth / 10} color="#3D03A8" />
					<MaterialIcons name="star" size={this.state.windowWidth / 10} color="grey" />
					<MaterialIcons name="star" size={this.state.windowWidth / 10} color="grey" />
					<MaterialIcons name="star" size={this.state.windowWidth / 10} color="grey" />
				</View>
			)
		} else {
			return (
				<View style={styles.stars}>
					<MaterialIcons name="star" size={this.state.windowWidth / 10} color="#3D03A8" />
					<MaterialIcons name="star" size={this.state.windowWidth / 10} color="grey" />
					<MaterialIcons name="star" size={this.state.windowWidth / 10} color="grey" />
					<MaterialIcons name="star" size={this.state.windowWidth / 10} color="grey" />
					<MaterialIcons name="star" size={this.state.windowWidth / 10} color="grey" />
				</View>
			)
		}
	}

	//----------------------------[Function] return challenge view based on complexity----------------------------//
	displayChallenges = () => {
		if (this.state.complexity == 'advanced') {
			if (this.state.advancedChallenge != null) {
				let arrayToDisplay = [null, null, null, null];
				for (let i = 0; i < 4; i++) {
					if (this.state.advancedChallengeSoFar != null && this.state.advancedChallengeSoFar[i] != null) {
						arrayToDisplay[i] = this.state.advancedChallengeSoFar[i];
						if (this.state.challengeComplete == false && i == 3) {
							this.setState({ challengeComplete: true });
						}
					}
					else {
						arrayToDisplay[i] = this.state.advancedChallenge[i];
					}
				}
				return (
					<View style={styles.challengeDisplay}>
						{arrayToDisplay.map(plant => (
							<View key={plant.challengeid} style={styles.challengeCardView}>
								{plant.discovered ?
									<Card style={styles.challengeCardDiscovered}>
										<Text style={styles.challengeText}>Discovered</Text>
										<Image style={styles.challengeImageDiscovered} source={plant.userimage} />
										<Text style={styles.texchallengeTextt}>{plant.genus}</Text>
										<Text style={styles.challengeText}>Example plant: {plant.common_name}</Text>
										<Text style={styles.challengeText}>Scientific: {plant.scientific_name}</Text>
									</Card>
									:
									<Card
										style={styles.challengeCardUndiscovered}
									>
										<Image style={styles.challengeImageUndiscovered} source={{ uri: plant.image_url }} />
										<Text style={styles.challengeText}>{plant.genus}</Text>
										<Text style={styles.challengeText}>Example plant: {plant.common_name}</Text>
										<Text style={styles.challengeText}>Scientific: {plant.scientific_name}</Text>
									</Card>}
							</View>
						))}
					</View>
				)
			}
		}
		if (this.state.complexity == 'intermediate') {
			if (this.state.intermediateChallange != null) {
				let arrayToDisplay = [null, null, null, null];
				for (let i = 0; i < 4; i++) {
					if (this.state.intermediateChallangeSoFar != null && this.state.intermediateChallangeSoFar[i] != null) {
						arrayToDisplay[i] = this.state.intermediateChallangeSoFar[i];
						if (this.state.challengeComplete == false && i == 3) {
							this.setState({ challengeComplete: true });
						}
					}
					else {
						arrayToDisplay[i] = { 'discovered': false, id: i };
					}
				}
				return (
					<View style={styles.challengeDisplay}>
						{arrayToDisplay.map(plant => (
							<View key={arrayToDisplay.id} style={styles.challengeCardView}>
								{plant.discovered ?
									<Card
										style={styles.challengeCardDiscovered}
									>
										<Image style={styles.challengeImageDiscovered} source={plant.userimage} />
										<Text>{plant.common_name}</Text>
									</Card>

									:
									<Card
										style={styles.challengeCardUndiscovered}
									>
										<Image style={styles.challengeImageUndiscovered} source={placeholder} />
									</Card>
								}
							</View>
						))}
					</View>)
			}
		}
		if (this.state.complexity == 'novice') {
			if (this.state.noviceChallenge != null) {
				let arrayToDisplay = [null, null, null, null];
				for (let i = 0; i < 4; i++) {
					if (this.state.noviceChallengeSoFar != null && this.state.noviceChallengeSoFar[i] != null) {
						arrayToDisplay[i] = this.state.noviceChallengeSoFar[i];
						if (this.state.challengeComplete == false && i == 3) {
							this.setState({ challengeComplete: true });
						}
					}
					else {
						arrayToDisplay[i] = { 'discovered': false, id: i };
					}
				}
				return (
					<View style={styles.challengeDisplay} >
						{arrayToDisplay.map(plant => (
							<View key={arrayToDisplay.id} style={styles.challengeCardView}>
								{plant.discovered == true ?
									<Card
										style={styles.challengeCardDiscovered}
									>
										<Image style={styles.challengeImageDiscovered} source={plant.userimage} />
										<Text>{plant.common_name}</Text>
									</Card>

									:
									<Card
										style={styles.challengeCardUndiscovered}
									>
										<Image style={styles.challengeImageUndiscovered} source={placeholder} />
									</Card>
								}
							</View>
						))}
					</View>)
			}
		}
		return (<View></View>)
	}
	//----------------------------[Function] Image handling----------------------------//
	_takePhoto = async () => {
		let pickerResult = await ImagePicker.launchCameraAsync({
			base64: true,
			allowsEditing: true,
			aspect: [4, 3]
		});
		this.setState({ isTakenAsPhoto: true });

		this._handleImagePicked(pickerResult);
	};

	_pickImage = async () => {
		let pickerResult = await ImagePicker.launchImageLibraryAsync({
			base64: true,
			allowsEditing: true,
			aspect: [4, 3]
		});
		this.setState({ isTakenAsPhoto: false });
		this._handleImagePicked(pickerResult);
	};

	_handleImagePicked = async pickerResult => {
		try {
			this.setState({ imageBase64: pickerResult });
			this.testsubmitToPlantid().then(() => this.submitToTrefle()).then(() => this.setState({ page: 'final' }));
		} catch (e) {
			console.log(e);
			alert('Upload failed');
		}
	};

	//----------------------------[Function] Submit Image to Plant.id API----------------------------//
	submitToPlantid = async () => {
		try {
			this.setState({ uploading: true });
			let body = JSON.stringify({
				api_key: Environment['PLANTID_API_KEY'],
				images: [this.state.imageBase64.base64],
				modifiers: ["crops_fast", "similar_images"],
				plant_language: "en",
				plant_details: ["common_names",
					"url",
					"name_authority",
					"wiki_description",
					"taxonomy",
					"synonyms"],
				latitude: this.state.latitude,
				longitude: this.state.longitude

			})

			let response = await fetch(
				"https://api.plant.id/v2/identify",
				{
					method: 'POST',
					headers: {
						"Content-Type": "application/json"
					},
					body: body,
				});

			let responseJson = await response.json();
			this.setState({
				plantidResponse: responseJson,
				suggestion: responseJson.suggestions[0],
				allowsave: true,
				uploading: false
			});
		} catch (error) {
			console.log(error);
		}
	}
	//----------------------------[Function] Simulute Submit Image to Plant.id API for Testing----------------------------//
	testsubmitToPlantid = async () => {
		try {
			this.setState({
				plantidResponse: sampledata,
				suggestion: sampledata.suggestions[0],
				allowsave: true,
				uploading: false
			})
		} catch (error) {
			console.log(error);
		}
	}
	//----------------------------[Function] Submit to Trefle API----------------------------//
	submitToTrefle = async () => {
		try {
			let plantname = this.state.suggestion.plant_details.scientific_name.toLowerCase().replace(/\s+/g, '-');
			let testplantname = "sedum-dasyphyllum";
			const response = await fetch(
				`https://trefle.io/api/v1/species/${testplantname}?token=${Environment['TREFLE_API_KEY']}`,
				{
					method: 'GET',
					headers: {
						"Content-Type": "application/json"
					}
				});
			const json = await response.json();
			this.setState({ trefleResponse: json.data });
			if (this.state.isTakenAsPhoto) {
				this.challengeCheck(json.data);
			}
		} catch (error) {
			console.log(error);
		}
	}

	//----------------------------[Function] Generate Challenge----------------------------//
	generateChallenge = async () => {

		if (this.state.challengeComplete) {
			this.setState({ challengeComplete: false })
			this.gainXp(140);
		}
		try {
			switch (this.state.complexity) {
				// Generate Advanced challenge
				case 'advanced': {
					let randomSelection = [];
					for (let i = 0; i < 4; i++) {
						let randomPage = Math.floor(Math.random() * 100) + 1;
						const response = await fetch(
							`https://trefle.io/api/v1/species?page=${randomPage}&image_url!=null&common_name!=null&token=${Environment['TREFLE_API_KEY']}`,
							{
								method: 'GET',
								headers: {
									"Content-Type": "application/json"
								}
							});
						const json = await response.json();

						while (randomSelection[i] == null) {
							let rand = Math.floor(Math.random() * 19);
							if (json.data[rand].image_url != null && json.data[rand].common_name != null) {
								randomSelection[i] = json.data[rand];
								randomSelection[i].discovered = false;
								randomSelection[i].challengeid = this.state.lastchallengeid + 1;
								this.setState({ lastchallengeid: this.state.lastchallengeid + 1 });
							}
						}
					}
					this.storeChallenge(randomSelection);
					this.storeChallengeProgress(this.state.advancedChallengeSoFar);
					this.setState({ advancedChallenge: randomSelection, advancedChallengeSoFar: [null, null, null, null] });
					this.storeLastChallengeID();
					break;
				}
				// Generate Intermediate challenge
				case 'intermediate': {
					//0=duration, 1=flowercolor, 2=soilhumidity, 3=fruitcolor
					let basis = [["annual", "biennial", "parennial"], ["red", "yellow", "blue"], ["1-4", "4-7", "7-10"], ["red", "yellow", "orange"]];
					let randpick = [Math.floor(Math.random() * 4), Math.floor(Math.random() * 3)];
					let selection = null;
					switch (randpick[0]) {
						case 0:
							selection = ["duration", basis[randpick[0]][randpick[1]], "The plant duration or growth cycles "]
							break;
						case 1:
							selection = ["flower.color", basis[randpick[0]][randpick[1]], "Plants flower colour "]
							break;
						case 2:
							selection = ["growth.soil_humidity", basis[randpick[0]][randpick[1]], "Plants required soil humidity (xerophile 0 to subaquatic 10) "]
							break;
						default:
							selection = ["fruit_or_seed.color", basis[randpick[0]][randpick[1]], "Plants fruit colour "]
							break;
					}
					selection.challengeid = this.state.lastchallengeid + 1;
					this.setState({ lastchallengeid: this.state.lastchallengeid + 1 });
					this.storeLastChallengeID();
					this.setState({ intermediateChallange: selection, intermediateChallangeSoFar: [null, null, null, null] });
					this.storeChallenge(selection);
					this.storeChallengeProgress(this.state.intermediateChallangeSoFar);
					break;
				}
				// Generate Novice Challenge
				case 'novice': {
					//0=edible, 1=flowercolor, 2=vegetable, 3=fruitcolor
					let basis = [[true, false], ["red", "yellow"], [true, false], ["red", "yellow"]];
					let randpick = [Math.floor(Math.random() * 4), Math.floor(Math.random() * 2)];
					let selection = null;
					switch (randpick[0]) {
						case 0:
							switch (randpick[1]) {
								case 0:
									selection = ["edible", basis[randpick[0]][randpick[1]], "are safe to eat"]
									break;
								default:
									selection = ["edible", basis[randpick[0]][randpick[1]], "are unsafe to eat"]
									break;
							}
							break;
						case 1:
							selection = ["flower.color", basis[randpick[0]][randpick[1]], "have a flower coloured"]
							break;
						case 2:
							switch (randpick[1]) {
								case 0:
									selection = ["vegetable", basis[randpick[0]][randpick[1]], "are vegetables"]
									break;
								default:
									selection = ["vegetable", basis[randpick[0]][randpick[1]], "are not vegetables"]
									break;
							}
							break;
						default:
							selection = ["fruit_or_seed.color", basis[randpick[0]][randpick[1]], "have fruit colored"]
							break;
					}
					selection.challengeid = this.state.lastchallengeid + 1;
					this.setState({ lastchallengeid: this.state.lastchallengeid + 1 });
					this.storeLastChallengeID();
					this.setState({ noviceChallenge: selection, noviceChallengeSoFar: [null, null, null, null] });
					this.storeChallenge(selection);
					break;
				}
				default:
					break;
			}
		} catch (error) {
			console.log(error);
		}
	}

}