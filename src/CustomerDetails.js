import React, { Component } from 'react';
import { Card, Alert, Row, Col, Badge, ProgressBar } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FaEnvelope, FaPhone, FaCity, FaGlobe, FaBuilding, FaBriefcase, FaInfoCircle, FaStar, FaChartBar } from 'react-icons/fa';
import './CustomerDetails.css';

// Static customer data - no API calls needed
const staticCustomerData = [
  {
    "id": 1,
    "name": "John Smith",
    "email": "jsmith@test.com",
    "phone": "123456789",
    "city": "bangalore",
    "state": "karnataka", 
    "country": "India",
    "organization": "Company 1",
    "jobProfile": "Software Developer",
    "additionalInfo": "Has Bought a lot of products before and a high Value Customer",
    "engagementScore": 95,
    "projectsCompleted": 12,
    "lastActivity": "2 days ago",
    "memberSince": "Jan 2022"
  },
  {
    "id": 2,
    "name": "ABCD",
    "email": "abcd@test.com",
    "phone": "987654321",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India", 
    "organization": "Company 2",
    "jobProfile": "Project Manager",
    "additionalInfo": "New customer with potential for long-term partnership",
    "engagementScore": 78,
    "projectsCompleted": 5,
    "lastActivity": "1 day ago",
    "memberSince": "Mar 2023"
  },
  {
    "id": 3,
    "name": "Tyrion",
    "email": "tyrion@test.com",
    "phone": "123412345",
    "city": "Delhi",
    "state": "Delhi",
    "country": "India",
    "organization": "Company 3", 
    "jobProfile": "Business Analyst",
    "additionalInfo": "Experienced customer with diverse requirements",
    "engagementScore": 88,
    "projectsCompleted": 8,
    "lastActivity": "5 hours ago",
    "memberSince": "Aug 2022"
  }
];

//This Component is a child Component of Customers Component
export default class CustomerDetails extends Component {
  constructor(props) {
    super(props);
    this.state = {
      customerDetails: null,
      loading: false,
      error: null
    }
  }

  //Function which is called when the component loads for the first time
  componentDidMount() {
    this.getCustomerDetails(this.props.val);
  }

  //Function which is called whenver the component is updated
  componentDidUpdate(prevProps) {
    //get Customer Details only if props has changed
    if (this.props.val !== prevProps.val) {
      this.getCustomerDetails(this.props.val);
    }
  }

  //Function to Load the customerdetails data from static data
  getCustomerDetails(id) {
    console.log(`Loading customer ${id} details from static data`);
    
    // Find customer in static data
    const customer = staticCustomerData.find(c => c.id === id);
    
    if (customer) {
      this.setState({
        customerDetails: { data: customer },
        loading: false,
        error: null
      });
    } else {
      this.setState({
        error: `Customer with ID ${id} not found in static data`,
        loading: false
      });
    }
  };

  render() {
    const { loading, error, customerDetails } = this.state;

    if (loading) {
      return (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="loading-container"
        >
          <div className="loading-spinner"></div>
          <p className="mt-3">Loading Customer Data...</p>
        </motion.div>
      );
    }

    if (error) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert variant="danger" className="error-alert">
            <FaInfoCircle className="me-2" />
            {error}
          </Alert>
        </motion.div>
      );
    }

    if (!customerDetails || !customerDetails.data) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert variant="info" className="info-alert">
            <FaInfoCircle className="me-2" />
            Select a customer to view details
          </Alert>
        </motion.div>
      );
    }

    const customer = customerDetails.data;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="customer-details-container"
      >
        {/* Customer Header */}
        <div className="details-header">
          <div className="header-content">
            <motion.div
              initial={{ scale: 0.9, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20 
              }}
              className="customer-avatar"
              style={{
                background: `linear-gradient(135deg, ${this.stringToColor(customer.name)}, ${this.adjustColor(this.stringToColor(customer.name), 40)})`
              }}
            >
              {customer.name.charAt(0).toUpperCase()}
            </motion.div>
            <div className="header-text">
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                {customer.name}
              </motion.h2>
              <motion.div 
                className="customer-subtitle"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                {customer.organization} • {customer.jobProfile}
              </motion.div>
              <div className="customer-badges mt-2">
                <Badge bg="success" className="me-2">Active</Badge>
                <Badge bg="info">Member since {customer.memberSince}</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        <Row className="mb-4">
          <Col md={4}>
            <Card className="metric-card border-0 shadow-sm h-100">
              <Card.Body className="text-center">
                <FaChartBar className="metric-icon text-primary mb-2" size={30} />
                <h4 className="metric-value text-primary">{customer.engagementScore}%</h4>
                <p className="metric-label">Engagement Score</p>
                <ProgressBar 
                  variant="primary" 
                  now={customer.engagementScore} 
                  className="mt-2"
                  style={{height: '6px'}}
                />
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="metric-card border-0 shadow-sm h-100">
              <Card.Body className="text-center">
                <FaStar className="metric-icon text-warning mb-2" size={30} />
                <h4 className="metric-value text-warning">{customer.projectsCompleted}</h4>
                <p className="metric-label">Projects Completed</p>
                <small className="text-muted">Last activity: {customer.lastActivity}</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="metric-card border-0 shadow-sm h-100">
              <Card.Body className="text-center">
                <FaBuilding className="metric-icon text-success mb-2" size={30} />
                <h4 className="metric-value text-success">4.8</h4>
                <p className="metric-label">Satisfaction Rating</p>
                <div className="star-rating">★★★★★</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Customer Information */}
        <Card className="customer-card details-card border-0 shadow-sm">
          <Card.Header className="bg-light border-0">
            <h5 className="mb-0">
              <FaInfoCircle className="me-2 text-primary" />
              Customer Information
            </h5>
          </Card.Header>
          <Card.Body>
            <Row className="g-4">
              <Col md={6}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="info-card"
                >
                  <div className="info-icon">
                    <FaEnvelope />
                  </div>
                  <div className="info-content">
                    <h6>EMAIL</h6>
                    <p>{customer.email}</p>
                  </div>
                </motion.div>
              </Col>

              <Col md={6}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="info-card"
                >
                  <div className="info-icon">
                    <FaPhone />
                  </div>
                  <div className="info-content">
                    <h6>PHONE</h6>
                    <p>{customer.phone}</p>
                  </div>
                </motion.div>
              </Col>

              <Col md={6}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="info-card"
                >
                  <div className="info-icon">
                    <FaCity />
                  </div>
                  <div className="info-content">
                    <h6>LOCATION</h6>
                    <p>{customer.city}, {customer.state}</p>
                  </div>
                </motion.div>
              </Col>

              <Col md={6}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="info-card"
                >
                  <div className="info-icon">
                    <FaGlobe />
                  </div>
                  <div className="info-content">
                    <h6>COUNTRY</h6>
                    <p>{customer.country}</p>
                  </div>
                </motion.div>
              </Col>

              <Col md={6}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="info-card"
                >
                  <div className="info-icon">
                    <FaBuilding />
                  </div>
                  <div className="info-content">
                    <h6>ORGANIZATION</h6>
                    <p>{customer.organization}</p>
                  </div>
                </motion.div>
              </Col>

              <Col md={6}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="info-card"
                >
                  <div className="info-icon">
                    <FaBriefcase />
                  </div>
                  <div className="info-content">
                    <h6>JOB PROFILE</h6>
                    <p>{customer.jobProfile}</p>
                  </div>
                </motion.div>
              </Col>
            </Row>

            {customer.additionalInfo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="additional-info mt-4"
              >
                <h5>
                  <FaInfoCircle className="me-2" />
                  Additional Information
                </h5>
                <div className="info-box">
                  <p>{customer.additionalInfo}</p>
                </div>
              </motion.div>
            )}
          </Card.Body>
        </Card>
      </motion.div>
    );
  }

  // Helper function to generate consistent colors from strings
  stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 60%)`;
  }

  // Helper function to adjust color brightness
  adjustColor(color, amount) {
    const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (hslMatch) {
      const h = parseInt(hslMatch[1]);
      const s = parseInt(hslMatch[2]);
      const l = Math.min(100, parseInt(hslMatch[3]) + amount);
      return `hsl(${h}, ${s}%, ${l}%)`;
    }
    return color;
  }
}
